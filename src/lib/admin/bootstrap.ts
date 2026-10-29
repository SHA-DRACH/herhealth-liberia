import crypto from "node:crypto";
import type { Db } from "../db";
import { hashPassword } from "../crypto";

export const DEFAULT_ADMIN_EMAIL = "admin@herhealth.local";

/**
 * First-run default admin. When no admin account exists, creates a Super Admin
 * (ADMIN_DEFAULT_EMAIL, default admin@herhealth.local) with ADMIN_DEFAULT_PASSWORD, or a random
 * one-time password printed once to the server console. No password is ever stored in the code
 * or repository, and the account must choose a new password at first sign-in.
 */
export async function ensureDefaultAdmin(db: Db): Promise<void> {
  const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM admin_users`);
  if (n > 0) return;
  const email = (process.env.ADMIN_DEFAULT_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const fromEnv = process.env.ADMIN_DEFAULT_PASSWORD;
  if (fromEnv !== undefined && fromEnv.length < 12) throw new Error("ADMIN_DEFAULT_PASSWORD must be at least 12 characters");
  const password = fromEnv || crypto.randomBytes(12).toString("base64url");
  const inserted = await db.query<{ id: number }>(
    `INSERT INTO admin_users (name, email, password_hash, role, must_change_password)
     SELECT 'Administrator', $1, $2, 'SUPER_ADMIN', true WHERE NOT EXISTS (SELECT 1 FROM admin_users) RETURNING id`,
    [email, hashPassword(password)],
  );
  if (!inserted.length) return;
  await db.query(`INSERT INTO audit_log (action, entity, entity_id) VALUES ('default_admin_created', 'admin_user', $1)`, [String(inserted[0].id)]);
  const lines = [
    "HerHealth: no admin account existed, so a default admin was created.",
    `  Sign in at /admin/login`,
    `  Email:    ${email}`,
    fromEnv ? "  Password: the value of ADMIN_DEFAULT_PASSWORD" : `  Password: ${password}   (shown only this once)`,
    "  You will be asked to choose a new password at first sign-in.",
  ];
  console.log(`\n${"=".repeat(72)}\n${lines.join("\n")}\n${"=".repeat(72)}\n`);
}
