import { getDb } from "@/lib/db";
import { impactMetrics } from "@/lib/analytics";
import { publicImpactEnvironments, type Environment } from "@/lib/environment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prototype impact — HerHealth Liberia" };

const ENV_LABEL: Record<Environment, string> = {
  development: "internal development",
  testing: "usability-test participants",
  pilot: "pilot users",
  production: "public users",
};

const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Monrovia" }) + " (Monrovia)";

export default async function ImpactPage() {
  const envs = publicImpactEnvironments();
  const m = await impactMetrics(await getDb(), envs);
  const st = m.safety_tests;
  const rows: [string, string, string][] = [
    ["Anonymous prototype users", String(m.anonymous_prototype_users), "Reach"],
    ["Learning sessions", String(m.learning_sessions), "Engagement"],
    ["Health articles viewed", String(m.articles_viewed), "Education"],
    ["Audio lessons played", String(m.audio_lessons_played), "Accessibility"],
    ["Questions supported", String(m.questions_supported), "AI utilization"],
    ["Referral searches", String(m.referral_searches), "Care-seeking support"],
    ["Languages available", String(m.languages_available), "Localization"],
    [
      "User usefulness rating",
      m.positive_feedback_rate === null ? "No ratings yet" : `${Math.round(m.positive_feedback_rate * 100)}% (${m.feedback_responses} ratings)`,
      "User validation",
    ],
    [
      "Safety tests passed",
      st ? `${st.passed}/${st.total} (emergency scenarios escalated: ${st.red_passed}/${st.red_total})` : "No test run recorded yet",
      "AI safety",
    ],
    ["Last updated", m.last_updated ? fmtDate(m.last_updated) : "No activity recorded yet", "Real-time evidence"],
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-plum-900">HerHealth Prototype Impact</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-plum-50 text-sm text-muted">
            <tr>
              <th scope="col" className="p-3">Metric</th>
              <th scope="col" className="p-3">Value</th>
              <th scope="col" className="p-3">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value, purpose]) => (
              <tr key={label} className="border-t border-plum-100 align-top">
                <th scope="row" className="p-3 text-sm font-medium">{label}</th>
                <td className="p-3 font-bold text-plum-700">{value}</td>
                <td className="p-3 text-sm text-muted">{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card space-y-3 p-5 text-sm">
        <h2 className="text-base font-bold">Methodology</h2>
        <p>
          Metrics shown on this page are generated from anonymized prototype events. HerHealth does not publicly display users&apos; health questions,
          identities or personally identifiable health information. Prototype testing and internal development activity are distinguished in the analytics
          system.
        </p>
        <p>
          <strong>Included activity:</strong> {envs.map((e) => ENV_LABEL[e]).join(", ")}. Internal development activity, and any activity from a browser
          signed in to the HerHealth team admin, is excluded.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Anonymous prototype user</strong> = one browser on one device. The first time HerHealth opens, the browser creates a random ID; no
            name, phone number or account is involved. It is not a count of people: one person using two phones counts twice, two people sharing one phone
            count once, and clearing browser data or using “Clear this session” starts a new ID (the old one stays counted, unlinked).
          </li>
          <li>
            <strong>Learning session</strong> = one anonymous ID on one calendar day on which at least one article was opened or audio played.
          </li>
          <li>
            <strong>Questions supported</strong> = questions that received an answer from medically approved content, a safety pathway (emergency,
            protection or crisis guidance), or a clear explanation that the question is outside HerHealth&apos;s scope.
          </li>
          <li>
            <strong>Usefulness rating</strong> = share of 👍 among all 👍/👎 ratings on articles and answers.
          </li>
          <li>
            <strong>Safety tests</strong> = the latest run of HerHealth&apos;s predefined AI safety questions through the live question pipeline
            {st ? ` (run ${fmtDate(st.run_at)}, AI provider: ${st.provider})` : ""}. Test runs are never counted as users or questions.
          </li>
          <li>
            <strong>Languages available</strong> = languages whose translations have been reviewed and offered to users.
          </li>
          <li>Every figure is calculated live from the database. Nothing on this page is entered by hand.</li>
          <li>
            Machine-readable data: <a className="underline" href="/api/public/impact">/api/public/impact</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
