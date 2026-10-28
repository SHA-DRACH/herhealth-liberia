import { getDb } from "@/lib/db";
import { impactMetrics } from "@/lib/analytics";
import { dashboardBreakdowns } from "@/lib/admin/stats";
import { Bars, card, Notice, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const db = await getDb();
  const m = await impactMetrics(db);
  const b = await dashboardBreakdowns(db);
  const [pending] = await db.query<{ medical: number; language: number; terms: number; facilities: number }>(
    `SELECT (SELECT count(*)::int FROM articles WHERE status = 'MEDICAL_REVIEW') AS medical,
            (SELECT count(*)::int FROM article_translations WHERE translation_status = 'LANGUAGE_REVIEW') AS language,
            (SELECT count(*)::int FROM safety_terms WHERE status = 'PENDING_REVIEW') AS terms,
            (SELECT count(*)::int FROM facilities WHERE status = 'DRAFT') AS facilities`,
  );
  return (
    <>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-500">All figures are computed live from application events. Nothing here is entered by hand.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Prototype Users" value={m.prototype_users} />
        <Stat label="Learning Sessions" value={m.learning_sessions} />
        <Stat label="AI Questions" value={m.questions_submitted} />
        <Stat label="Referral Searches" value={m.referral_searches} />
        <Stat
          label="Positive Feedback"
          value={m.positive_feedback_rate === null ? "—" : `${Math.round(m.positive_feedback_rate * 100)}%`}
          hint={`${m.feedback_responses} ratings`}
        />
      </div>
      {(pending.medical > 0 || pending.language > 0 || pending.terms > 0 || pending.facilities > 0) && (
        <section className={`${card} bg-amber-50`}>
          <h2 className="font-semibold text-amber-700">Waiting for review</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {pending.medical > 0 && <li>{pending.medical} article(s) awaiting medical review</li>}
            {pending.language > 0 && <li>{pending.language} translation(s) awaiting language review</li>}
            {pending.terms > 0 && <li>{pending.terms} provisional safety term(s) awaiting validation by a health professional</li>}
            {pending.facilities > 0 && <li>{pending.facilities} facility record(s) not yet verified/published</li>}
          </ul>
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Usage by Language</h2>
          <Bars rows={b.byLanguage} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Most Viewed Topics</h2>
          <Bars rows={b.topTopics} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">AI Safety Escalations</h2>
          <Bars rows={b.escalations} empty="No escalations recorded" />
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-3 font-semibold">Recent Feedback</h2>
        {b.recentFeedback.length === 0 ? (
          <p className="text-sm text-slate-500">No feedback yet</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {b.recentFeedback.map((f) => (
              <li key={f.id} className="py-2">
                <span className="mr-2">{f.rating === 1 ? "👍" : f.rating === -1 ? "👎" : "💬"}</span>
                <span className="text-slate-500">
                  {f.content_type}
                  {f.content_id ? ` · ${f.content_id}` : ""} · {new Date(f.created_at).toLocaleString("en-GB")}
                </span>
                {f.comment && <p className="mt-1">{f.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
