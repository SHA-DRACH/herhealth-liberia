import { getDb } from "@/lib/db";
import { apiAdmin } from "@/lib/admin/api";
import { usabilitySummary } from "@/lib/admin/stats";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await apiAdmin("testing.manage");
  if (admin instanceof Response) return admin;
  const db = await getDb();
  const sessions = await db.query(`SELECT test_code, test_date, participant_code, age_range, language, device, tasks_assigned, tasks_completed, task_results,
      completion_seconds, errors, ease_rating, understandable_rating, would_be_useful, difficulties, improvements, consent_confirmed FROM usability_tests ORDER BY test_date`);
  return json({ summary: await usabilitySummary(db), sessions });
}
