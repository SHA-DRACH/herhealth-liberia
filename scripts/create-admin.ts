/**
 * Creates an admin account. No default or seeded accounts exist.
 *
 *   npm run admin:create -- --name "Full Name" --email you@example.org --role SUPER_ADMIN
 *
 * The password is read from the terminal (or ADMIN_PASSWORD for automation).
 * With the embedded development database, stop `npm run dev` first: PGlite allows one process at a time.
 */
import readline from "node:readline";
import { getDb } from "../src/lib/db";
import { hashPassword } from "../src/lib/crypto";

const ROLES = ["SUPER_ADMIN", "PRODUCT_ADMIN", "HEALTH_REVIEWER", "TRANSLATOR", "LANGUAGE_REVIEWER", "RESEARCH_MEAL"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function askHidden(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  let muted = false;
  out._writeToOutput = (s: string) => {
    if (!muted || s.includes(prompt)) out.output.write(s);
  };
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const name = arg("name");
  const email = arg("email")?.toLowerCase();
  const role = arg("role") ?? "SUPER_ADMIN";
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !ROLES.includes(role)) {
    console.error(`Usage: npm run admin:create -- --name "Full Name" --email you@example.org --role ${ROLES.join("|")}`);
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Password (min. 12 characters): "));
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  process.env.HERHEALTH_SKIP_DEFAULT_ADMIN = "1";
  const db = await getDb();
  await db.query(`INSERT INTO admin_users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)`, [name, email, hashPassword(password), role]);
  await db.query(`INSERT INTO audit_log (action, entity, entity_id, details) VALUES ('admin_user_created_cli', 'admin_user', $1, $2)`, [
    email,
    JSON.stringify({ role }),
  ]);
  console.log(`Created ${role} account for ${email}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
