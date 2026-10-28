import { getDb } from "@/lib/db";
import { isUuid } from "@/lib/crypto";
import { error, json, rateLimited, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * "Clear this session": deletes free-text feedback written in this session and unlinks every
 * server record from the anonymous ID. Aggregate counts are kept so published metrics stay
 * truthful, but nothing can be traced back to the ID afterwards.
 */
export async function DELETE(req: Request) {
  if (rateLimited(req, "session", 10)) return error(429, "rate limited");
  const body = await readJson(req);
  const id = body?.sessionId;
  if (!isUuid(id)) return error(400, "invalid session");
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.query(`UPDATE feedback SET comment = NULL, session_id = NULL WHERE session_id = $1`, [id]);
    await tx.query(`UPDATE ai_queries SET session_id = NULL WHERE session_id = $1`, [id]);
    await tx.query(`UPDATE analytics_events SET anonymous_session_id = NULL WHERE anonymous_session_id = $1`, [id]);
    // The session row is replaced by an unlinked placeholder so the user count stays accurate.
    await tx.query(`UPDATE anonymous_sessions SET id = gen_random_uuid(), language = NULL WHERE id = $1`, [id]);
  });
  return json({ ok: true });
}
