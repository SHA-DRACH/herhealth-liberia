/** Applies pending database migrations (they also run automatically on first connection). */
import { getDb } from "../src/lib/db";

getDb()
  .then(async (db) => {
    const rows = await db.query<{ version: number }>(`SELECT version FROM schema_migrations ORDER BY version`);
    console.log(`Database is at migration ${rows.at(-1)?.version ?? 0}.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
