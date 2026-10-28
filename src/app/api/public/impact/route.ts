import { getDb } from "@/lib/db";
import { impactMetrics } from "@/lib/analytics";
import { publicImpactEnvironments } from "@/lib/environment";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public, anonymised, aggregate-only metrics (specification §21). Internal development activity is excluded. */
export async function GET() {
  const m = await impactMetrics(await getDb(), publicImpactEnvironments());
  return json({
    ...m,
    methodology:
      "Metrics are generated from anonymized prototype events. HerHealth does not publicly display users' health questions, identities or personally identifiable health information. Prototype testing and internal development activity are distinguished in the analytics system; only the listed environments are counted. An anonymous prototype user is one browser on one device (a random ID), not a person.",
  });
}
