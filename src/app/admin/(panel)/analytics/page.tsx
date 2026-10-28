import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { impactMetrics } from "@/lib/analytics";
import { aiQueryBreakdown, dailyActivity, eventCounts } from "@/lib/admin/stats";
import { Bars, card, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin("analytics.view");
  const db = await getDb();
  const m = await impactMetrics(db);
  const events = await eventCounts(db);
  const daily = await dailyActivity(db);
  const q = await aiQueryBreakdown(db);
  return (
    <>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-slate-600">
        Anonymous, event-based analytics. No names, phone numbers, IP addresses or question text are collected. The public summary is at{" "}
        <a className="underline" href="/impact">
          /impact
        </a>{" "}
        and{" "}
        <a className="underline" href="/api/public/impact">
          /api/public/impact
        </a>
        .
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Prototype users" value={m.prototype_users} />
        <Stat label="Articles viewed" value={m.articles_viewed} />
        <Stat label="Audio lessons played" value={m.audio_lessons_played} />
        <Stat label="Questions answered" value={`${m.questions_answered}/${m.questions_submitted}`} hint={`${m.safety_escalations} safety escalations`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Active anonymous users per day (last 14 days)</h2>
          <Bars rows={daily} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Events</h2>
          <Bars rows={events} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Ask HerHealth outcomes</h2>
          <Bars rows={q.byStatus} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Questions by topic</h2>
          <Bars rows={q.byIntent} />
        </section>
      </div>
    </>
  );
}
