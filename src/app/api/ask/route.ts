import { getDb } from "@/lib/db";
import { getAIProvider } from "@/lib/ai/provider";
import { ask, MAX_QUESTION_LENGTH } from "@/lib/ask/pipeline";
import { activeLanguages } from "@/lib/i18n";
import { error, json, rateLimited, readJson } from "@/lib/http";
import { isUuid } from "@/lib/crypto";
import { requestEnvironment } from "@/lib/environment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (rateLimited(req, "ask", 10)) return error(429, "Too many questions. Please wait a minute.");
  const body = await readJson(req);
  const question = typeof body?.question === "string" ? body.question : "";
  if (!question.trim() || question.length > MAX_QUESTION_LENGTH) return error(400, `Question must be 1–${MAX_QUESTION_LENGTH} characters`);
  const langs = await activeLanguages();
  const language = langs.some((l) => l.code === body?.language) ? String(body!.language) : "en";
  const sessionId = isUuid(body?.sessionId) ? body!.sessionId : null;
  try {
    const db = await getDb();
    const result = await ask(db, await getAIProvider(), { question, language, sessionId, environment: await requestEnvironment() });
    return json(result);
  } catch (e) {
    console.error("ask pipeline failed", e instanceof Error ? e.message : "");
    return error(500, "Could not answer right now");
  }
}
