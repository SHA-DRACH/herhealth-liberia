import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { aiQueryBreakdown } from "@/lib/admin/stats";
import { SAFETY_CASES } from "@/lib/safety/test-cases";
import { addSafetyTermAction, reviewSafetyTermAction, runSafetySuiteAction } from "../../actions";
import { Badge, Bars, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SafetyPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin("safety.run");
  const db = await getDb();
  const terms = await db.query<{ id: number; term: string; risk_level: string; status: string; reviewer: string | null }>(
    `SELECT t.id, t.term, t.risk_level, t.status, u.name AS reviewer FROM safety_terms t LEFT JOIN admin_users u ON u.id = t.reviewed_by
      ORDER BY CASE t.risk_level WHEN 'RED' THEN 0 WHEN 'MENTAL_HEALTH_CRISIS' THEN 1 WHEN 'PROTECTION' THEN 2 ELSE 3 END, t.term`,
  );
  const runs = await db.query<{ id: number; provider: string; total: number; passed: number; red_total: number; red_passed: number; created_at: string; name: string | null }>(
    `SELECT r.*, u.name FROM safety_test_runs r LEFT JOIN admin_users u ON u.id = r.run_by ORDER BY r.created_at DESC LIMIT 10`,
  );
  const latest = runs[0]
    ? await db.query<{ case_code: string; expected_risk: string; actual_risk: string; expected_pathway: string; actual_pathway: string; passed: boolean; failure_reasons: string | null }>(
        `SELECT * FROM safety_test_results WHERE run_id = $1 ORDER BY passed, case_code`,
        [runs[0].id],
      )
    : [];
  const q = await aiQueryBreakdown(db);
  const pending = terms.filter((t) => t.status === "PENDING_REVIEW").length;
  const reviewer = can(admin.role, "safety.review");
  const questions = new Map(SAFETY_CASES.map((c) => [c.code, c.question]));

  return (
    <>
      <h1 className="text-2xl font-bold">AI Safety Review</h1>
      <Notice sp={sp} />

      <section className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Safety test suite ({SAFETY_CASES.length} predefined questions)</h2>
          <form action={runSafetySuiteAction}>
            <button className={btnPrimary}>Run suite now</button>
          </form>
        </div>
        <p className="text-sm text-slate-600">Runs every case through the live /api/ask pipeline and records the real outcome. Test runs are not counted in usage analytics.</p>
        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">No runs recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-1">When</th>
                <th>Provider</th>
                <th>Passed</th>
                <th>RED escalated</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-1">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                  <td>{r.provider}</td>
                  <td>
                    {r.passed}/{r.total}
                  </td>
                  <td className={r.red_passed === r.red_total ? "text-teal-700" : "font-bold text-alert-700"}>
                    {r.red_passed}/{r.red_total}
                  </td>
                  <td>{r.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {latest.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-plum-700">Latest run — case results</summary>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {latest.map((r) => (
                <li key={r.case_code} className="py-2">
                  <span className={r.passed ? "text-teal-700" : "font-bold text-alert-700"}>{r.passed ? "PASS" : "FAIL"}</span> {r.case_code} — “
                  {questions.get(r.case_code)}”
                  <div className="text-xs text-slate-500">
                    expected {r.expected_risk} → {r.expected_pathway}; got {r.actual_risk} → {r.actual_pathway}
                    {r.failure_reasons ? ` · ${r.failure_reasons}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Live questions by outcome</h2>
          <Bars rows={q.byStatus} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">By risk level</h2>
          <Bars rows={q.byRisk} />
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">By topic</h2>
          <Bars rows={q.byIntent} />
        </section>
      </div>
      <p className="text-sm text-slate-500">Question text is never stored, so individual questions cannot be reviewed here — only their classification and outcome.</p>

      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Red-flag and safeguarding lexicon</h2>
        {pending > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            {pending} provisional term(s) await validation by a qualified health professional. They were derived only from the concepts named in the product
            specification and are enforced in the meantime, because over-escalating is the safe failure direction.
          </p>
        )}
        <p className="text-sm text-slate-600">
          Words match as prefixes (“bleed” matches “bleeding”). Words written together must appear together; “a + b” means both appear anywhere in the
          question. Any match bypasses normal AI generation for RED, PROTECTION and MENTAL_HEALTH_CRISIS.
        </p>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1">Term</th>
              <th>Level</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-1 font-mono">{t.term}</td>
                <td>
                  <Badge value={t.risk_level} />
                </td>
                <td>
                  <Badge value={t.status} /> {t.reviewer && <span className="text-xs text-slate-500">by {t.reviewer}</span>}
                </td>
                <td className="flex gap-1 py-1">
                  {reviewer && t.status !== "APPROVED" && (
                    <form action={reviewSafetyTermAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className={btnSecondary}>Validate</button>
                    </form>
                  )}
                  {reviewer && t.status !== "RETIRED" && (
                    <form action={reviewSafetyTermAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="status" value="RETIRED" />
                      <button className={btnSecondary}>Retire</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviewer ? (
          <form action={addSafetyTermAction} className="grid gap-2 md:grid-cols-[1fr_12rem_1fr_auto] md:items-end">
            <label className={label}>
              New term
              <input name="term" required className={input} />
            </label>
            <label className={label}>
              Level
              <select name="risk_level" className={input}>
                <option>RED</option>
                <option>PROTECTION</option>
                <option>MENTAL_HEALTH_CRISIS</option>
                <option>AMBER</option>
              </select>
            </label>
            <label className={label}>
              Clinical note
              <input name="notes" className={input} />
            </label>
            <button className={btnPrimary}>Add</button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Only Health Reviewers can validate or change the lexicon.</p>
        )}
      </section>
    </>
  );
}
