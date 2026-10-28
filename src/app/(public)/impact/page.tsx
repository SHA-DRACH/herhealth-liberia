import { getDb } from "@/lib/db";
import { impactMetrics } from "@/lib/analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prototype impact — HerHealth Liberia" };

export default async function ImpactPage() {
  const m = await impactMetrics(await getDb());
  const tiles: [string, string][] = [
    ["Prototype users", String(m.prototype_users)],
    ["Learning sessions", String(m.learning_sessions)],
    ["Health articles viewed", String(m.articles_viewed)],
    ["Audio lessons played", String(m.audio_lessons_played)],
    ["Questions supported", String(m.questions_supported)],
    ["Referral searches", String(m.referral_searches)],
    ["Languages available", String(m.languages_available)],
    ["User usefulness rating", m.positive_feedback_rate === null ? "No ratings yet" : `${Math.round(m.positive_feedback_rate * 100)}%`],
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-plum-900">HerHealth Prototype Impact</h1>
      <dl className="grid grid-cols-2 gap-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="card p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-plum-700">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        Last updated: {m.last_updated ? new Date(m.last_updated).toLocaleString("en-GB", { timeZone: "Africa/Monrovia" }) + " (Monrovia)" : "no activity recorded yet"}
      </p>
      <section className="card space-y-2 p-5 text-sm">
        <h2 className="font-bold">Methodology</h2>
        <p>
          Metrics are aggregated and anonymized. HerHealth does not publish users&apos; reproductive-health questions or personally identifiable health
          information.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Every figure is calculated live from events recorded by the application. Nothing on this page is entered by hand.</li>
          <li>Prototype users: anonymous device IDs that have used the app at least once (cleared sessions remain counted, unlinked).</li>
          <li>Learning sessions: distinct days on which an anonymous ID opened an article or played audio.</li>
          <li>Questions supported: questions that received a grounded answer or a safety pathway (emergency, protection or crisis guidance).</li>
          <li>Usefulness rating: share of 👍 among all 👍/👎 ratings on articles and answers ({m.feedback_responses} ratings).</li>
          <li>
            Machine-readable data: <a className="underline" href="/api/public/impact">/api/public/impact</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
