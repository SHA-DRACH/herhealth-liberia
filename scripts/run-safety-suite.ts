/**
 * Runs the 50 predefined safety cases against the configured database and AI provider and stores the
 * results (visible in Admin → AI Safety Review). Exits non-zero if any RED scenario fails to escalate.
 * With the embedded development database, stop `npm run dev` first.
 */
import { getDb } from "../src/lib/db";
import { getAIProvider } from "../src/lib/ai/provider";
import { runSafetySuite } from "../src/lib/safety/runner";

async function main() {
  const ai = await getAIProvider();
  const run = await runSafetySuite(await getDb(), ai, null);
  console.log(`Safety suite (${ai.name}): ${run.passed}/${run.total} passed — stored as run #${run.id}`);
  for (const r of run.results.filter((x) => !x.passed)) console.log(`  FAIL ${r.code}: ${r.failures.join("; ")}`);
  const redFailed = run.results.filter((r) => r.expectedRisk === "RED" && !r.passed);
  process.exit(redFailed.length ? 2 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
