import path from "node:path";
import fs from "node:fs";
import { migrations } from "./schema";

/**
 * Minimal database interface shared by the two supported engines:
 *  - PostgreSQL (production) via `pg`, selected when DATABASE_URL is set
 *  - PGlite (embedded PostgreSQL compiled to WASM) for local development and tests
 * All queries are parameterised ($1, $2 …). Never interpolate user input into SQL.
 */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
}

type Global = typeof globalThis & { __herhealthDb?: Promise<Db> };
const g = globalThis as Global;

async function createPg(url: string): Promise<Db> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 10 });
  const wrap = (client: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[] }> }): Db => ({
    async query<T>(sql: string, params?: unknown[]) {
      return (await client.query(sql, params)).rows as T[];
    },
    async transaction<T>(fn: (tx: Db) => Promise<T>) {
      return fn(this);
    },
  });
  return {
    query: async <T,>(sql: string, params?: unknown[]) => (await pool.query(sql, params)).rows as T[],
    async transaction<T>(fn: (tx: Db) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(wrap(client));
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function createPglite(dataDir: string | undefined): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { vector } = await import("@electric-sql/pglite-pgvector");
  if (dataDir) fs.mkdirSync(dataDir, { recursive: true });
  const pg = new PGlite(dataDir ? { dataDir, extensions: { vector } } : { extensions: { vector } });
  await pg.waitReady;
  type Tx = { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[] }> };
  const wrap = (tx: Tx): Db => ({
    query: async <T,>(sql: string, params?: unknown[]) => (await tx.query(sql, params)).rows as T[],
    transaction: async <T,>(fn: (t: Db) => Promise<T>) => fn(wrap(tx)),
  });
  return {
    query: async <T,>(sql: string, params?: unknown[]) => (await pg.query(sql, params)).rows as T[],
    transaction: <T,>(fn: (tx: Db) => Promise<T>) => pg.transaction((tx) => fn(wrap(tx as unknown as Tx))) as Promise<T>,
  };
}

export async function migrate(db: Db): Promise<void> {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const done = new Set((await db.query<{ version: number }>(`SELECT version FROM schema_migrations`)).map((r) => r.version));
  for (const m of migrations) {
    if (done.has(m.version)) continue;
    await db.transaction(async (tx) => {
      for (const stmt of m.statements) await tx.query(stmt);
      await tx.query(`INSERT INTO schema_migrations (version) VALUES ($1)`, [m.version]);
    });
  }
}

/** Opens a fresh database (used by tests with an in-memory PGlite). */
export async function openDb(opts: { url?: string; dataDir?: string; memory?: boolean } = {}): Promise<Db> {
  const db = opts.url ? await createPg(opts.url) : await createPglite(opts.memory ? undefined : opts.dataDir);
  await migrate(db);
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__herhealthDb) {
    const url = process.env.DATABASE_URL || undefined;
    const dataDir = process.env.PGLITE_DATA_DIR || path.join(process.cwd(), "data", "pglite");
    g.__herhealthDb = openDb({ url, dataDir })
      .then(async (db) => {
        // First run: create the default admin (skipped by `npm run admin:create`, which makes its own account).
        if (process.env.HERHEALTH_SKIP_DEFAULT_ADMIN !== "1") {
          const { ensureDefaultAdmin } = await import("../admin/bootstrap");
          await ensureDefaultAdmin(db);
        }
        return db;
      })
      .catch((e) => {
        g.__herhealthDb = undefined;
        throw e;
      });
  }
  return g.__herhealthDb;
}
