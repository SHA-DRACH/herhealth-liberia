import type { Db } from "../db";

/** Admin-only breakdowns. All derived from recorded events; never contains question text. */
export async function dashboardBreakdowns(db: Db) {
  const byLanguage = await db.query<{ label: string; value: number }>(
    `SELECT COALESCE(l.name, e.language) AS label, count(DISTINCT e.anonymous_session_id)::int AS value
       FROM analytics_events e LEFT JOIN languages l ON l.code = e.language
      WHERE e.language IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`,
  );
  const topTopics = await db.query<{ label: string; value: number }>(
    `SELECT COALESCE(t.title, e.metadata->>'slug') AS label, count(*)::int AS value
       FROM analytics_events e
       LEFT JOIN articles a ON a.slug = e.metadata->>'slug'
       LEFT JOIN article_translations t ON t.article_id = a.id AND t.language_id = (SELECT id FROM languages WHERE code = 'en')
      WHERE e.event_name = 'article_viewed' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  );
  const escalations = await db.query<{ label: string; value: number }>(
    `SELECT response_status AS label, count(*)::int AS value FROM ai_queries
      WHERE response_status IN ('EMERGENCY','PROTECTION','MENTAL_HEALTH_CRISIS') GROUP BY 1 ORDER BY 2 DESC`,
  );
  const recentFeedback = await db.query<{ id: number; content_type: string; content_id: string | null; rating: number | null; comment: string | null; created_at: string }>(
    `SELECT id, content_type, content_id, rating, comment, created_at FROM feedback ORDER BY created_at DESC LIMIT 10`,
  );
  return { byLanguage, topTopics, escalations, recentFeedback };
}

export async function eventCounts(db: Db) {
  return db.query<{ label: string; value: number }>(`SELECT event_name AS label, count(*)::int AS value FROM analytics_events GROUP BY 1 ORDER BY 2 DESC`);
}

export async function dailyActivity(db: Db, days = 14) {
  return db.query<{ label: string; value: number }>(
    `SELECT to_char(d, 'DD Mon') AS label,
            (SELECT count(DISTINCT anonymous_session_id)::int FROM analytics_events WHERE created_at >= d AND created_at < d + interval '1 day') AS value
       FROM generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d ORDER BY d`,
    [days],
  );
}

export async function aiQueryBreakdown(db: Db) {
  const byStatus = await db.query<{ label: string; value: number }>(`SELECT response_status AS label, count(*)::int AS value FROM ai_queries GROUP BY 1 ORDER BY 2 DESC`);
  const byIntent = await db.query<{ label: string; value: number }>(
    `SELECT COALESCE(intent, 'unclassified') AS label, count(*)::int AS value FROM ai_queries GROUP BY 1 ORDER BY 2 DESC`,
  );
  const byRisk = await db.query<{ label: string; value: number }>(`SELECT risk_level AS label, count(*)::int AS value FROM ai_queries GROUP BY 1 ORDER BY 2 DESC`);
  return { byStatus, byIntent, byRisk };
}

export async function usabilitySummary(db: Db) {
  const [s] = await db.query<{
    testers: number;
    task_completion: number | null;
    understandable: number | null;
    useful: number | null;
    avg_ease: number | null;
    avg_minutes: number | null;
  }>(`SELECT count(*)::int AS testers,
             sum(tasks_completed)::float / NULLIF(sum(tasks_assigned), 0) AS task_completion,
             avg(CASE WHEN understandable_rating >= 4 THEN 1.0 WHEN understandable_rating IS NULL THEN NULL ELSE 0.0 END) AS understandable,
             avg(CASE WHEN would_be_useful = 'YES' THEN 1.0 WHEN would_be_useful IS NULL THEN NULL ELSE 0.0 END) AS useful,
             avg(ease_rating)::float AS avg_ease,
             avg(completion_seconds)::float / 60 AS avg_minutes
        FROM usability_tests`);
  const perTask = await db.query<{ task: number; completed: number; total: number }>(
    `SELECT i AS task, count(*) FILTER (WHERE (task_results->>(i-1))::boolean)::int AS completed, count(*)::int AS total
       FROM usability_tests, generate_series(1,5) i WHERE task_results IS NOT NULL GROUP BY i ORDER BY i`,
  );
  return { ...s, perTask };
}
