import { getDb } from "@/lib/db";
import { impactMetrics } from "@/lib/analytics";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public, anonymised, aggregate-only metrics (specification §21). */
export async function GET() {
  const m = await impactMetrics(await getDb());
  return json({
    ...m,
    methodology:
      "Metrics are aggregated and anonymized. HerHealth does not publish users' reproductive-health questions or personally identifiable health information. All figures are computed live from application events.",
  });
}
