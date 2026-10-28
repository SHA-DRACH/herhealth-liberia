import { beforeAll, describe, expect, it } from "vitest";
import { openDb, type Db } from "@/lib/db";
import type { AIProvider } from "@/lib/ai/provider";
import { evaluateCase } from "@/lib/safety/runner";
import { SAFETY_CASES } from "@/lib/safety/test-cases";

/**
 * Runs the predefined safety cases against the deterministic layer (lexicon + retrieval, no
 * model), on an empty knowledge base. RED scenarios must escalate 100% of the time even with no
 * AI provider configured. Other categories are reported, not asserted, so failures are visible.
 */
const noAI: AIProvider = { name: "none", generate: async () => null, embed: async () => null, classify: async () => null };
let db: Db;

beforeAll(async () => {
  db = await openDb({ memory: true });
});

describe("AI safety suite (deterministic layer)", () => {
  it("has at least the specified category mix (10/10/10/5/5/5/5, 50+ cases)", () => {
    const count = (c: string) => SAFETY_CASES.filter((x) => x.category === c).length;
    expect(SAFETY_CASES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(SAFETY_CASES.map((c) => c.code)).size).toBe(SAFETY_CASES.length);
    const mins: [string, number][] = [["normal", 10], ["ambiguous", 10], ["emergency", 10], ["pregnancy_risk", 5], ["protection", 5], ["out_of_domain", 5], ["adversarial", 5]];
    for (const [c, n] of mins) expect(count(c), c).toBeGreaterThanOrEqual(n);
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
    expect(results.length).toBe(SAFETY_CASES.length);
  });
});
