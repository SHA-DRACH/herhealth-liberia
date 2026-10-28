import type { Db } from "./db";
import { isUuid } from "./crypto";

/** Events a browser may send to /api/events. Everything else is recorded server-side only. */
export const CLIENT_EVENTS = [
  "session_started",
  "language_selected",
  "article_viewed",
  "audio_started",
  "audio_completed",
  "facility_search",
  "facility_viewed",
  "lesson_completed",
  "offline_content_saved",
] as const;

export const SERVER_EVENTS = ["question_submitted", "answer_generated", "safety_escalation", "feedback_positive", "feedback_negative"] as const;
export type EventName = (typeof CLIENT_EVENTS)[number] | (typeof SERVER_EVENTS)[number];

const METADATA_KEYS = ["slug", "county", "service", "facility_id", "risk_level", "content_type"];

/** Keeps only short, whitelisted, non-free-text metadata values. */
export function sanitizeMetadata(meta: unknown): Record<string, string> | null {
  if (!meta || typeof meta !== "object") return null;
  const out: Record<string, string> = {};
  for (const k of METADATA_KEYS) {
    const v = (meta as Record<string, unknown>)[k];
    if ((typeof v === "string" || typeof v === "number") && String(v).length <= 80 && /^[\w\s&./-]*$/.test(String(v))) out[k] = String(v);
  }
  return Object.keys(out).length ? out : null;
}

export async function touchSession(db: Db, sessionId: string | null | undefined, language?: string | null) {
  if (!isUuid(sessionId)) return;
  await db.query(
    `INSERT INTO anonymous_sessions (id, language) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET last_active = now(), language = COALESCE($2, anonymous_sessions.language)`,
    [sessionId, language ?? null],
  );
}

export async function recordEvent(
  db: Db,
  e: { sessionId?: string | null; name: EventName; category?: string | null; language?: string | null; metadata?: Record<string, string> | null },
) {
  const sid = isUuid(e.sessionId) ? e.sessionId : null;
  await touchSession(db, sid, e.language);
  await db.query(
    `INSERT INTO analytics_events (anonymous_session_id, event_name, category, language, metadata) VALUES ($1,$2,$3,$4,$5)`,
    [sid, e.name, e.category ?? null, e.language ?? null, e.metadata ? JSON.stringify(e.metadata) : null],
  );
}

export interface ImpactMetrics {
  prototype_users: number;
  learning_sessions: number;
  articles_viewed: number;
  audio_lessons_played: number;
  questions_submitted: number;
  questions_answered: number;
  questions_supported: number;
  safety_escalations: number;
  languages_used: number;
  languages_available: number;
  referral_searches: number;
  feedback_responses: number;
  positive_feedback_rate: number | null;
  last_updated: string | null;
}

/** Aggregates only. No identifiers, no question text, no per-person histories. */
export async function impactMetrics(db: Db): Promise<ImpactMetrics> {
  const [r] = await db.query<Record<string, string | number | null>>(`
    SELECT
      (SELECT count(*) FROM anonymous_sessions) AS prototype_users,
      (SELECT count(DISTINCT (anonymous_session_id, date_trunc('day', created_at)))
         FROM analytics_events WHERE event_name IN ('article_viewed','audio_started') AND anonymous_session_id IS NOT NULL) AS learning_sessions,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'article_viewed') AS articles_viewed,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'audio_started') AS audio_lessons_played,
      (SELECT count(*) FROM ai_queries) AS questions_submitted,
      (SELECT count(*) FROM ai_queries WHERE response_status = 'ANSWER') AS questions_answered,
      (SELECT count(*) FROM ai_queries WHERE response_status IN ('ANSWER','EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS')) AS questions_supported,
      (SELECT count(*) FROM ai_queries WHERE response_status IN ('EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS')) AS safety_escalations,
      (SELECT count(DISTINCT language) FROM analytics_events WHERE language IS NOT NULL) AS languages_used,
      (SELECT count(*) FROM languages WHERE status = 'ACTIVE') AS languages_available,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'facility_search') AS referral_searches,
      (SELECT count(*) FROM feedback WHERE rating IS NOT NULL) AS feedback_responses,
      (SELECT avg(CASE WHEN rating = 1 THEN 1.0 ELSE 0.0 END) FROM feedback WHERE rating IS NOT NULL) AS positive_feedback_rate,
      (SELECT max(created_at) FROM analytics_events) AS last_updated
  `);
  const n = (k: string) => Number(r[k] ?? 0);
  return {
    prototype_users: n("prototype_users"),
    learning_sessions: n("learning_sessions"),
    articles_viewed: n("articles_viewed"),
    audio_lessons_played: n("audio_lessons_played"),
    questions_submitted: n("questions_submitted"),
    questions_answered: n("questions_answered"),
    questions_supported: n("questions_supported"),
    safety_escalations: n("safety_escalations"),
    languages_used: n("languages_used"),
    languages_available: n("languages_available"),
    referral_searches: n("referral_searches"),
    feedback_responses: n("feedback_responses"),
    positive_feedback_rate: r.positive_feedback_rate === null ? null : Math.round(Number(r.positive_feedback_rate) * 100) / 100,
    last_updated: r.last_updated ? new Date(r.last_updated as string).toISOString() : null,
  };
}
