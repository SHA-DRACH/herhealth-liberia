import type { Db } from "./db";
import { isUuid } from "./crypto";
import { ENVIRONMENTS, type Environment } from "./environment";

/** Activity counts per environment, so the admin can see what is internal and what is participant activity. */
export async function environmentBreakdown(db: Db) {
  return db.query<{ environment: Environment; devices: number; events: number; questions: number }>(
    `SELECT e AS environment,
            (SELECT count(*)::int FROM anonymous_sessions WHERE environment = e) AS devices,
            (SELECT count(*)::int FROM analytics_events WHERE environment = e) AS events,
            (SELECT count(*)::int FROM ai_queries WHERE environment = e) AS questions
       FROM unnest($1::text[]) e`,
    [[...ENVIRONMENTS]],
  );
}

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

/**
 * Registers an anonymous device ID. A device keeps the environment it was first seen in, except
 * that participant test mode always marks it as testing (facilitators may reuse a team device).
 */
export async function touchSession(db: Db, sessionId: string | null | undefined, language: string | null | undefined, environment: Environment) {
  if (!isUuid(sessionId)) return;
  await db.query(
    `INSERT INTO anonymous_sessions (id, language, environment) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET last_active = now(), language = COALESCE($2, anonymous_sessions.language),
       environment = CASE WHEN $3 = 'testing' THEN 'testing' ELSE anonymous_sessions.environment END`,
    [sessionId, language ?? null, environment],
  );
}

export async function recordEvent(
  db: Db,
  e: {
    sessionId?: string | null;
    name: EventName;
    environment: Environment;
    category?: string | null;
    language?: string | null;
    metadata?: Record<string, string> | null;
  },
) {
  const sid = isUuid(e.sessionId) ? e.sessionId : null;
  await touchSession(db, sid, e.language, e.environment);
  await db.query(
    `INSERT INTO analytics_events (anonymous_session_id, event_name, category, language, metadata, environment) VALUES ($1,$2,$3,$4,$5,$6)`,
    [sid, e.name, e.category ?? null, e.language ?? null, e.metadata ? JSON.stringify(e.metadata) : null, e.environment],
  );
}

export interface SafetySuiteSummary {
  passed: number;
  total: number;
  red_passed: number;
  red_total: number;
  provider: string;
  run_at: string;
}

export interface ImpactMetrics {
  /** Environments the figures include. */
  environments: Environment[];
  anonymous_prototype_users: number;
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
  /** Latest stored run of the predefined AI safety suite (not environment-specific). */
  safety_tests: SafetySuiteSummary | null;
  last_updated: string | null;
}

/**
 * Aggregates only. No identifiers, no question text, no per-person histories.
 * Only activity recorded in the given environments is counted.
 */
export async function impactMetrics(db: Db, environments: readonly Environment[] = ENVIRONMENTS): Promise<ImpactMetrics> {
  const envs = [...environments];
  const [r] = await db.query<Record<string, string | number | null>>(
    `SELECT
      (SELECT count(*) FROM anonymous_sessions WHERE environment = ANY($1)) AS anonymous_prototype_users,
      (SELECT count(DISTINCT (anonymous_session_id, date_trunc('day', created_at)))
         FROM analytics_events WHERE event_name IN ('article_viewed','audio_started') AND anonymous_session_id IS NOT NULL AND environment = ANY($1)) AS learning_sessions,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'article_viewed' AND environment = ANY($1)) AS articles_viewed,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'audio_started' AND environment = ANY($1)) AS audio_lessons_played,
      (SELECT count(*) FROM ai_queries WHERE environment = ANY($1)) AS questions_submitted,
      (SELECT count(*) FROM ai_queries WHERE response_status = 'ANSWER' AND environment = ANY($1)) AS questions_answered,
      (SELECT count(*) FROM ai_queries WHERE response_status IN ('ANSWER','EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS','MEDICATION','OUT_OF_SCOPE') AND environment = ANY($1)) AS questions_supported,
      (SELECT count(*) FROM ai_queries WHERE response_status IN ('EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS') AND environment = ANY($1)) AS safety_escalations,
      (SELECT count(DISTINCT language) FROM analytics_events WHERE language IS NOT NULL AND environment = ANY($1)) AS languages_used,
      (SELECT count(*) FROM languages WHERE status = 'ACTIVE') AS languages_available,
      (SELECT count(*) FROM analytics_events WHERE event_name = 'facility_search' AND environment = ANY($1)) AS referral_searches,
      (SELECT count(*) FROM feedback WHERE rating IS NOT NULL AND environment = ANY($1)) AS feedback_responses,
      (SELECT avg(CASE WHEN rating = 1 THEN 1.0 ELSE 0.0 END) FROM feedback WHERE rating IS NOT NULL AND environment = ANY($1)) AS positive_feedback_rate,
      (SELECT max(created_at) FROM analytics_events WHERE environment = ANY($1)) AS last_updated`,
    [envs],
  );
  const [run] = await db.query<SafetySuiteSummary>(
    `SELECT passed, total, red_passed, red_total, provider, created_at AS run_at FROM safety_test_runs ORDER BY created_at DESC LIMIT 1`,
  );
  const n = (k: string) => Number(r[k] ?? 0);
  return {
    environments: envs,
    anonymous_prototype_users: n("anonymous_prototype_users"),
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
    safety_tests: run ? { ...run, run_at: new Date(run.run_at).toISOString() } : null,
    last_updated: r.last_updated ? new Date(r.last_updated as string).toISOString() : null,
  };
}
