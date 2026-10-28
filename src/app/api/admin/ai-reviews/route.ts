import { getDb } from "@/lib/db";
import { apiAdmin } from "@/lib/admin/api";
import { aiQueryBreakdown } from "@/lib/admin/stats";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Safety-test runs and classification of live questions (question text is never stored). */
export async function GET() {
  const admin = await apiAdmin("safety.run");
  if (admin instanceof Response) return admin;
  const db = await getDb();
  const runs = await db.query(`SELECT id, provider, total, passed, red_total, red_passed, created_at FROM safety_test_runs ORDER BY created_at DESC LIMIT 20`);
  const latest = runs.length ? await db.query(`SELECT * FROM safety_test_results WHERE run_id = $1 ORDER BY case_code`, [(runs[0] as { id: number }).id]) : [];
  return json({ runs, latest, liveQuestions: await aiQueryBreakdown(db) });
}
