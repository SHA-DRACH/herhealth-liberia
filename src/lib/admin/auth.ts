import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, type Db } from "../db";
import { hashPassword, keyedHash, randomToken, verifyPassword } from "../crypto";

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
 * Capability map. The Super Admin can manage all site content and settings. Medical approval
 * belongs only to Health Reviewers and translation approval only to Language Reviewers — not even
 * a Super Admin can do either, so "medically reviewed" always means an independent reviewer approved it.
 */
const CAPABILITIES = {
  "content.edit": ["SUPER_ADMIN", "PRODUCT_ADMIN"],
  "content.publish": ["SUPER_ADMIN", "PRODUCT_ADMIN"],
  "content.medical_review": ["HEALTH_REVIEWER"],
  "translation.edit": ["SUPER_ADMIN", "TRANSLATOR", "PRODUCT_ADMIN"],
  "translation.review": ["LANGUAGE_REVIEWER"],
  "audio.manage": ["SUPER_ADMIN", "PRODUCT_ADMIN", "TRANSLATOR"],
  "sources.manage": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER"],
  "clinical.view": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "RESEARCH_MEAL"],
  "clinical.manage": ["SUPER_ADMIN", "HEALTH_REVIEWER"],
  "facilities.manage": ["SUPER_ADMIN", "PRODUCT_ADMIN"],
  "safety.review": ["HEALTH_REVIEWER"],
  "safety.edit_messages": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER"],
  "safety.run": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "RESEARCH_MEAL"],
  "analytics.view": ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "RESEARCH_MEAL"],
  "feedback.view": ["SUPER_ADMIN", "PRODUCT_ADMIN", "RESEARCH_MEAL"],
  "testing.manage": ["SUPER_ADMIN", "PRODUCT_ADMIN", "RESEARCH_MEAL"],
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

const MAX_ATTEMPTS = 5;

export type LoginResult = { ok: true; user: AdminUser } | { ok: false; reason: "invalid" | "locked" };

/** True when the current request arrived over HTTPS (directly or via a TLS-terminating proxy). */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim();
  if (proto) return proto === "https";
  return (h.get("origin") ?? h.get("referer") ?? "").startsWith("https://");
}

/** Brute force is slowed with an in-memory lockout (nothing persisted). */
export async function login(email: string, password: string): Promise<LoginResult> {
  const key = email.trim().toLowerCase();
  const a = attempts.get(key);
  if (a && a.count >= MAX_ATTEMPTS && a.until > Date.now()) return { ok: false, reason: "locked" };
  const db = await getDb();
  const [u] = await db.query<AdminUser & { password_hash: string; status: string }>(
    `SELECT id, name, email, role, password_hash, status FROM admin_users WHERE lower(email) = $1`,
    [key],
  );
  if (!u || u.status !== "ACTIVE" || !verifyPassword(password, u.password_hash)) {
    const next = { count: (a && a.until > Date.now() ? a.count : 0) + 1, until: Date.now() + 15 * 60_000 };
    attempts.set(key, next);
    return { ok: false, reason: next.count >= MAX_ATTEMPTS ? "locked" : "invalid" };
  }
  attempts.delete(key);
  const token = randomToken();
  await db.query(`INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at) VALUES ($1, $2, now() + interval '${SESSION_HOURS} hours')`, [
    keyedHash(token),
    u.id,
  ]);
  await db.query(`UPDATE admin_users SET last_login = now() WHERE id = $1`, [u.id]);
  await audit(db, u.id, "login", "admin_user", String(u.id));
  // Secure follows the actual connection: a Secure cookie sent over plain http is silently dropped by
  // browsers, which made sign-in appear to fail and loop back to the login page.
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: await isHttps(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return { ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role } };
}

/** Where to go after sign-in: the admin page originally requested, otherwise the dashboard. */
export function safeAdminPath(next: unknown): string {
  if (typeof next !== "string" || !/^\/admin(\/[\w\-/]*)?(\?[\w=&%.\-]*)?$/.test(next) || next.startsWith("/admin/login")) return "/admin";
  return next;
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

export async function currentAdmin(): Promise<(AdminUser & { mustChangePassword: boolean }) | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [u] = await db.query<AdminUser & { mustChangePassword: boolean }>(
    `SELECT u.id, u.name, u.email, u.role, u.must_change_password AS "mustChangePassword"
       FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'ACTIVE'`,
    [keyedHash(token)],
  );
  return u ?? null;
}

/**
 * For pages and server actions. Redirects to login; to the password page while a default or
 * temporary password is still in use; or to the dashboard if the role lacks the capability.
 */
export async function requireAdmin(cap?: Capability): Promise<AdminUser> {
  const u = await currentAdmin();
  // A cookie is present (the middleware let the request through) but the session expired or was revoked.
  if (!u) redirect("/admin/login?expired=1");
  if (u.mustChangePassword) redirect("/admin/password?required=1");
  if (cap && !can(u.role, cap)) redirect("/admin?denied=1");
  return u;
}

export type PasswordChangeResult = { ok: true } | { ok: false; error: string };

export async function changePassword(adminId: number, current: string, next: string, confirm: string): Promise<PasswordChangeResult> {
  if (next.length < 12) return { ok: false, error: "The new password must be at least 12 characters." };
  if (next !== confirm) return { ok: false, error: "The new passwords do not match." };
  if (next === current) return { ok: false, error: "Choose a password different from the current one." };
  const db = await getDb();
  const [u] = await db.query<{ password_hash: string }>(`SELECT password_hash FROM admin_users WHERE id = $1`, [adminId]);
  if (!u || !verifyPassword(current, u.password_hash)) return { ok: false, error: "The current password is incorrect." };
  await db.query(`UPDATE admin_users SET password_hash = $2, must_change_password = false WHERE id = $1`, [adminId, hashPassword(next)]);
  // Sign out every other session for this account.
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  await db.query(`DELETE FROM admin_sessions WHERE admin_user_id = $1 AND token_hash <> $2`, [adminId, keyedHash(token)]);
  await audit(db, adminId, "password_changed", "admin_user", String(adminId));
  return { ok: true };
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
