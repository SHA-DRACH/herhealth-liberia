import { getDb } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { stripIdentifiers } from "@/lib/ask/pipeline";
import { isUuid } from "@/lib/crypto";
import { error, json, rateLimited, readJson } from "@/lib/http";
import { requestEnvironment } from "@/lib/environment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (rateLimited(req, "feedback", 20)) return error(429, "rate limited");
  const body = await readJson(req);
  const contentType = body?.contentType;
  if (contentType !== "article" && contentType !== "answer" && contentType !== "app") return error(400, "invalid content type");
  const rating = body?.rating === 1 || body?.rating === -1 ? body.rating : null;
  const comment = typeof body?.comment === "string" ? stripIdentifiers(body.comment).slice(0, 1000) : "";
  if (rating === null && !comment) return error(400, "rating or comment required");
  const contentId = typeof body?.contentId === "string" && /^[\w-]{1,80}$/.test(body.contentId) ? body.contentId : null;
  const sessionId = isUuid(body?.sessionId) ? body!.sessionId : null;
  const language = typeof body?.language === "string" && /^[a-z-]{2,10}$/.test(body.language) ? body.language : null;

  const db = await getDb();
  const environment = await requestEnvironment();
  await db.query(`INSERT INTO feedback (session_id, content_type, content_id, rating, comment, environment) VALUES ($1,$2,$3,$4,$5,$6)`, [
    sessionId,
    contentType,
    contentId,
    rating,
    comment || null,
    environment,
  ]);
  if (rating !== null)
    await recordEvent(db, {
      sessionId,
      name: rating === 1 ? "feedback_positive" : "feedback_negative",
      environment,
      language,
      metadata: { content_type: contentType },
    });
  return json({ ok: true });
}
