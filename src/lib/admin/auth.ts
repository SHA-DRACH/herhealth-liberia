import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, type Db } from "../db";
import { keyedHash, randomToken, verifyPassword } from "../crypto";

export const ADMIN_COOKIE = "hh_admin";
const SESSION_HOURS = 8;

export const ROLES = ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "TRANSLATOR", "LANGUAGE_REVIEWER", "RESEARCH_MEAL"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PRODUCT_ADMIN: "Product Admin",
  HEALTH_REVIEWER: "Health Reviewer",
  TRANSLATOR: "Translator",
  LANGUAGE_REVIEWER: "Language Reviewer",
  RESEARCH_MEAL: "Research/MEAL",
};

/**
 * Least-privilege capability map. Medical approval belongs only to Health Reviewers and
 * translation approval only to Language Reviewers — not even a Super Admin can do either.
 */
const CAPABILITIES = {
  "content.edit": ["PRODUCT_ADMIN"],
  "content.publish": ["PRODUCT_ADMIN"],
  "content.medical_review": ["HEALTH_REVIEWER"],
  "translation.edit": ["TRANSLATOR", "PRODUCT_ADMIN"],
  "translation.review": ["LANGUAGE_REVIEWER"],
  "audio.manage": ["PRODUCT_ADMIN", "TRANSLATOR"],
  "sources.manage": ["PRODUCT_ADMIN", "HEALTH_REVIEWER"],
  "facilities.manage": ["PRODUCT_ADMIN"],
  "safety.review": ["HEALTH_REVIEWER"],
  "safety.edit_messages": ["PRODUCT_ADMIN", "HEALTH_REVIEWER"],
  "safety.run": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "RESEARCH_MEAL"],
  "analytics.view": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "RESEARCH_MEAL"],
  "feedback.view": ["SUPER_ADMIN", "PRODUCT_ADMIN", "RESEARCH_MEAL"],
  "testing.manage": ["PRODUCT_ADMIN", "RESEARCH_MEAL"],
  "users.manage": ["SUPER_ADMIN"],
  "settings.manage": ["SUPER_ADMIN", "PRODUCT_ADMIN"],
  "audit.view": ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;
export type Capability = keyof typeof CAPABILITIES;

export function can(role: Role, cap: Capability): boolean {
  return (CAPABILITIES[cap] as readonly Role[]).includes(role);
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const attempts = new Map<string, { count: number; until: number }>();

/** Returns the admin on success. Brute force is slowed with an in-memory lockout (nothing persisted). */
export async function login(email: string, password: string): Promise<AdminUser | null> {
  const key = email.toLowerCase();
  const a = attempts.get(key);
  if (a && a.count >= 5 && a.until > Date.now()) return null;
  const db = await getDb();
  const [u] = await db.query<AdminUser & { password_hash: string; status: string }>(
    `SELECT id, name, email, role, password_hash, status FROM admin_users WHERE lower(email) = $1`,
    [key],
  );
  if (!u || u.status !== "ACTIVE" || !verifyPassword(password, u.password_hash)) {
    const next = { count: (a && a.until > Date.now() ? a.count : 0) + 1, until: Date.now() + 15 * 60_000 };
    attempts.set(key, next);
    return null;
  }
  attempts.delete(key);
  const token = randomToken();
  await db.query(`INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at) VALUES ($1, $2, now() + interval '${SESSION_HOURS} hours')`, [
    keyedHash(token),
    u.id,
  ]);
  await db.query(`UPDATE admin_users SET last_login = now() WHERE id = $1`, [u.id]);
  await audit(db, u.id, "login", "admin_user", String(u.id));
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [keyedHash(token)]);
  }
  jar.delete(ADMIN_COOKIE);
}

export async function currentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [u] = await db.query<AdminUser>(
    `SELECT u.id, u.name, u.email, u.role FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'ACTIVE'`,
    [keyedHash(token)],
  );
  return u ?? null;
}

/** For pages and server actions. Redirects to login, or to the dashboard if the role lacks the capability. */
export async function requireAdmin(cap?: Capability): Promise<AdminUser> {
  const u = await currentAdmin();
  if (!u) redirect("/admin/login");
  if (cap && !can(u.role, cap)) redirect("/admin?denied=1");
  return u;
}

/**
 * Server actions already enforce same-origin through Next.js. Admin JSON API routes call this
 * as well (CSRF defence for non-GET requests).
 */
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (origin && host && new URL(origin).host !== host) throw new Error("cross-origin request rejected");
}

export async function audit(db: Db, adminId: number | null, action: string, entity: string, entityId?: string | null, details?: unknown) {
  await db.query(`INSERT INTO audit_log (admin_user_id, action, entity, entity_id, details) VALUES ($1,$2,$3,$4,$5)`, [
    adminId,
    action,
    entity,
    entityId ?? null,
    details === undefined ? null : JSON.stringify(details),
  ]);
}
