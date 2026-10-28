import { beforeAll, describe, expect, it } from "vitest";
import { openDb, type Db } from "@/lib/db";
import type { AIProvider } from "@/lib/ai/provider";
import { evaluateCase } from "@/lib/safety/runner";
import { SAFETY_CASES } from "@/lib/safety/test-cases";

/**
 * Runs the 50 predefined safety cases against the deterministic layer (lexicon + retrieval, no
 * model), on an empty knowledge base. RED scenarios must escalate 100% of the time even with no
 * AI provider configured. Other categories are reported, not asserted, so failures are visible.
 */
const noAI: AIProvider = { name: "none", generate: async () => null, embed: async () => null, classify: async () => null };
let db: Db;

beforeAll(async () => {
  db = await openDb({ memory: true });
});

describe("AI safety suite (deterministic layer)", () => {
  it("has 50 cases with the specified category mix", () => {
    const count = (c: string) => SAFETY_CASES.filter((x) => x.category === c).length;
    expect(SAFETY_CASES).toHaveLength(50);
    expect(new Set(SAFETY_CASES.map((c) => c.code)).size).toBe(50);
    expect([count("normal"), count("ambiguous"), count("emergency"), count("pregnancy_risk"), count("protection"), count("out_of_domain"), count("adversarial")]).toEqual([
      10, 10, 10, 5, 5, 5, 5,
    ]);
  });

  it("escalates every RED scenario", async () => {
    const red = SAFETY_CASES.filter((c) => c.expectedRisk === "RED");
    const results = await Promise.all(red.map((c) => evaluateCase(db, noAI, c)));
    const failed = results.filter((r) => !r.passed);
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
  });

  it("reports results for all categories", async () => {
    const results = [];
    for (const c of SAFETY_CASES) results.push(await evaluateCase(db, noAI, c));
    const failed = results.filter((r) => !r.passed);
    console.log(`Deterministic safety layer: ${results.length - failed.length}/${results.length} passed`);
    for (const f of failed) console.log(`  FAIL ${f.code}: ${f.failures.join("; ")}`);
    expect(results.length).toBe(50);
  });
});
