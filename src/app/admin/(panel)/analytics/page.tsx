import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { impactMetrics } from "@/lib/analytics";
import { ENVIRONMENTS, publicImpactEnvironments, type Environment } from "@/lib/environment";
import { aiQueryBreakdown, dailyActivity, eventCounts } from "@/lib/admin/stats";
import { Bars, card, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ env?: string }> }) {
  await requireAdmin("analytics.view");
  const { env = "evidence" } = await searchParams;
  const envs: Environment[] =
    env === "all" ? [...ENVIRONMENTS] : ENVIRONMENTS.includes(env as Environment) ? [env as Environment] : publicImpactEnvironments();
  const selected = env === "all" || ENVIRONMENTS.includes(env as Environment) ? env : "evidence";
  const db = await getDb();
  const m = await impactMetrics(db, envs);
  const events = await eventCounts(db, envs);
  const daily = await dailyActivity(db, 14, envs);
  const q = await aiQueryBreakdown(db, envs);
  const tabs = ["evidence", ...ENVIRONMENTS, "all"];
  return (
    <>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-slate-600">
        Anonymous, event-based analytics. No names, phone numbers, IP addresses or question text are collected. The public summary is at{" "}
        <a className="underline" href="/impact">
          /impact
        </a>
        . “Evidence” = the environments counted publicly ({publicImpactEnvironments().join(", ")}).
      </p>
      <nav aria-label="Environment" className="flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/analytics?env=${t}`}
            aria-current={t === selected ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${t === selected ? "border-plum-600 bg-plum-600 text-white" : "border-slate-300 bg-white"}`}
          >
            {t}
          </Link>
        ))}
      </nav>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Anonymous prototype users" value={m.anonymous_prototype_users} />
        <Stat label="Articles viewed" value={m.articles_viewed} />
        <Stat label="Audio lessons played" value={m.audio_lessons_played} />
        <Stat label="Questions answered" value={`${m.questions_answered}/${m.questions_submitted}`} hint={`${m.safety_escalations} safety escalations`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Active anonymous devices per day (last 14 days)</h2>
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
