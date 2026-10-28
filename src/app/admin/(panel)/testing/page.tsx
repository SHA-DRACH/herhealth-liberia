import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { usabilitySummary } from "@/lib/admin/stats";
import { cookies } from "next/headers";
import { TEST_MODE_COOKIE } from "@/lib/environment";
import { endParticipantModeAction, recordUsabilityTestAction, startParticipantModeAction } from "../../actions";
import { btnPrimary, btnSecondary, card, input, label, Notice, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const TASKS = [
  "Find information explaining when someone should seek help for menstrual problems",
  "Listen to one health article",
  "Ask HerHealth a reproductive-health question",
  "Find a health service",
  "Change the application language",
];

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export default async function TestingPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  await requireAdmin("testing.manage");
  const testMode = (await cookies()).get(TEST_MODE_COOKIE)?.value === "1";
  const db = await getDb();
  const s = await usabilitySummary(db);
  const rows = await db.query<{
    test_code: string;
    test_date: string;
    participant_code: string;
    age_range: string;
    tasks_completed: number;
    tasks_assigned: number;
    ease_rating: number | null;
    understandable_rating: number | null;
    would_be_useful: string | null;
    difficulties: string | null;
    improvements: string | null;
  }>(
    `SELECT test_code, test_date::text, participant_code, age_range, tasks_completed, tasks_assigned, ease_rating, understandable_rating,
            would_be_useful, difficulties, improvements FROM usability_tests ORDER BY created_at DESC`,
  );
  const langs = await db.query<{ code: string; name: string }>(`SELECT code, name FROM languages WHERE status = 'ACTIVE' ORDER BY sort_order`);

  return (
    <>
      <h1 className="text-2xl font-bold">Usability testing</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        Record each session with informed consent and an anonymous participant code only, never a name. Start with adult participants (18+) unless
        approved safeguarding procedures for minors are in place. Report the real results, including low ones, and what was fixed.
      </p>
      <section className={`${card} space-y-2`}>
        <h2 className="font-semibold">Participant device mode</h2>
        <p className="text-sm text-slate-600">
          Before handing a phone to a participant, start participant mode on that phone. It signs you out, gives the participant a fresh anonymous ID and
          records their activity as <strong>testing</strong> (so it counts as evidence while your own activity stays internal). Mode ends automatically
          after 4 hours, or sign in again on the phone and end it here.
        </p>
        {testMode ? (
          <form action={endParticipantModeAction}>
            <button className={btnSecondary}>End participant mode on this device</button>
          </form>
        ) : (
          <form action={startParticipantModeAction}>
            <button className={btnPrimary}>Start participant mode on this device</button>
          </form>
        )}
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Testers" value={s.testers} hint="target 15–25 adults" />
        <Stat label="Task completion" value={pct(s.task_completion)} hint="target ≥ 80%" />
        <Stat label="Found it understandable" value={pct(s.understandable)} hint="rated 4–5 of 5; target ≥ 80%" />
        <Stat label="Would be useful" value={pct(s.useful)} hint="answered Yes; target ≥ 80%" />
        <Stat label="Average ease" value={s.avg_ease === null ? "—" : `${Number(s.avg_ease).toFixed(1)} / 5`} />
      </div>
      {s.perTask.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">Completion by task</h2>
          <ul className="space-y-1 text-sm">
            {s.perTask.map((t) => (
              <li key={t.task}>
                Task {t.task}: {TASKS[t.task - 1]} — {t.completed}/{t.total}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={recordUsabilityTestAction} className={`${card} grid gap-3 md:grid-cols-3`}>
        <h2 className="font-semibold md:col-span-3">Record a test session</h2>
        <label className={label}>
          Date
          <input type="date" name="test_date" required className={input} />
        </label>
        <label className={label}>
          Participant anonymous ID
          <input name="participant_code" required placeholder="P-001" className={input} />
        </label>
        <label className={label}>
          Age range
          <select name="age_range" required className={input}>
            <option value="18-24">18–24</option>
            <option value="25-34">25–34</option>
            <option value="35-44">35–44</option>
            <option value="45+">45+</option>
            <option value="15-17">15–17 (only with approved safeguarding procedures)</option>
            <option value="PREFER_NOT">Prefer not to say</option>
          </select>
        </label>
        <label className={label}>
          Language
          <select name="language" className={input}>
            {langs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Device
          <input name="device" placeholder="e.g. Android phone model" className={input} />
        </label>
        <label className={label}>
          Total time (minutes)
          <input type="number" name="completion_minutes" min={0} step="0.5" className={input} />
        </label>
        <fieldset className="md:col-span-3">
          <legend className="text-sm font-medium">Tasks completed</legend>
          {TASKS.map((t, i) => (
            <label key={t} className="mt-1 flex items-start gap-2 text-sm">
              <input type="checkbox" name={`task_${i + 1}`} className="mt-1" /> {i + 1}. {t}
            </label>
          ))}
        </fieldset>
        <label className={label}>
          Errors observed
          <input type="number" name="errors" min={0} defaultValue={0} className={input} />
        </label>
        <label className={label}>
          How easy was HerHealth to use? (1–5)
          <input type="number" name="ease_rating" min={1} max={5} required className={input} />
        </label>
        <label className={label}>
          Was the information understandable? (1–5)
          <input type="number" name="understandable_rating" min={1} max={5} required className={input} />
        </label>
        <label className={label}>
          Useful to women or girls in your community?
          <select name="would_be_useful" required className={input}>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="UNSURE">Unsure</option>
          </select>
        </label>
        <label className={`${label} md:col-span-3`}>
          What was difficult?
          <textarea name="difficulties" rows={2} className={input} />
        </label>
        <label className={`${label} md:col-span-3`}>
          What should we improve?
          <textarea name="improvements" rows={2} className={input} />
        </label>
        <label className={`${label} md:col-span-3`}>
          Facilitator comments
          <textarea name="comments" rows={2} className={input} />
        </label>
        <label className="flex items-start gap-2 text-sm md:col-span-3">
          <input type="checkbox" name="consent_confirmed" required className="mt-1" /> Informed consent was obtained and recorded according to the research
          protocol.
        </label>
        <div className="md:col-span-3">
          <button className={btnPrimary}>Save test session</button>
        </div>
      </form>

      <section className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Test</th>
              <th className="p-3">Date</th>
              <th className="p-3">Participant</th>
              <th className="p-3">Age</th>
              <th className="p-3">Tasks</th>
              <th className="p-3">Ease</th>
              <th className="p-3">Understandable</th>
              <th className="p-3">Useful</th>
              <th className="p-3">Difficulties / improvements</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-slate-500">
                  No test sessions recorded yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.test_code} className="border-b align-top last:border-0">
                <td className="p-3 font-mono">{r.test_code}</td>
                <td className="p-3">{r.test_date}</td>
                <td className="p-3">{r.participant_code}</td>
                <td className="p-3">{r.age_range}</td>
                <td className="p-3">
                  {r.tasks_completed}/{r.tasks_assigned}
                </td>
                <td className="p-3">{r.ease_rating ?? "—"}</td>
                <td className="p-3">{r.understandable_rating ?? "—"}</td>
                <td className="p-3">{r.would_be_useful ?? "—"}</td>
                <td className="p-3">{[r.difficulties, r.improvements].filter(Boolean).join(" / ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
