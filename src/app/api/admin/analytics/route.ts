import { getDb } from "@/lib/db";
import { apiAdmin } from "@/lib/admin/api";
import { aiQueryBreakdown, dailyActivity, eventCounts } from "@/lib/admin/stats";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await apiAdmin("analytics.view");
  if (admin instanceof Response) return admin;
  const db = await getDb();
  return json({ events: await eventCounts(db), daily: await dailyActivity(db), questions: await aiQueryBreakdown(db) });
}
