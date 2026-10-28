import { getDb } from "@/lib/db";
import { apiAdmin } from "@/lib/admin/api";
import { impactMetrics } from "@/lib/analytics";
import { dashboardBreakdowns } from "@/lib/admin/stats";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await apiAdmin();
  if (admin instanceof Response) return admin;
  const db = await getDb();
  return json({ metrics: await impactMetrics(db), ...(await dashboardBreakdowns(db)) });
}
