import { getDb } from "@/lib/db";
import { CLIENT_EVENTS, recordEvent, sanitizeMetadata } from "@/lib/analytics";
import { error, json, rateLimited, readJson } from "@/lib/http";
import { requestEnvironment } from "@/lib/environment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (rateLimited(req, "events", 120)) return error(429, "rate limited");
  const body = await readJson(req, 2_000);
  const name = body?.event;
  if (typeof name !== "string" || !(CLIENT_EVENTS as readonly string[]).includes(name)) return error(400, "unknown event");
  const db = await getDb();
  await recordEvent(db, {
    sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
    name: name as (typeof CLIENT_EVENTS)[number],
    environment: await requestEnvironment(),
    category: typeof body?.category === "string" && /^[a-z0-9-]{1,40}$/.test(body.category) ? body.category : null,
    language: typeof body?.language === "string" && /^[a-z-]{2,10}$/.test(body.language) ? body.language : null,
    metadata: sanitizeMetadata(body?.metadata),
  });
  return json({ ok: true });
}
