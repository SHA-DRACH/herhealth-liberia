import { describe, expect, it } from "vitest";
import { classifyWithTerms, termMatches, normalize, type SafetyTerm } from "@/lib/safety/classifier";
import { postGenerationCheck } from "@/lib/safety/postcheck";
import { stripIdentifiers } from "@/lib/ask/pipeline";

const terms: SafetyTerm[] = [
  { term: "pregnan + bleed", risk_level: "RED", status: "PENDING_REVIEW" },
  { term: "severe bleed", risk_level: "RED", status: "APPROVED" },
  { term: "rape", risk_level: "PROTECTION", status: "APPROVED" },
  { term: "pain", risk_level: "AMBER", status: "APPROVED" },
  { term: "retired", risk_level: "RED", status: "RETIRED" },
];

describe("term matching", () => {
  it("matches word prefixes and phrases", () => {
    expect(termMatches(normalize("Severe bleeding since morning"), "severe bleed")).toBe(true);
    expect(termMatches(normalize("bleeding that is severe"), "severe bleed")).toBe(false);
  });
  it("matches co-occurrence terms anywhere", () => {
    expect(termMatches(normalize("I am pregnant and bleeding heavily."), "pregnan + bleed")).toBe(true);
    expect(termMatches(normalize("I am pregnant"), "pregnan + bleed")).toBe(false);
  });
  it("normalises curly apostrophes", () => {
    expect(termMatches(normalize("I can’t breathe"), "can't breathe")).toBe(true);
  });
});

describe("classifyWithTerms", () => {
  it("returns the most severe level and keeps the others", () => {
    const c = classifyWithTerms("I was raped and I am pregnant and bleeding", terms);
    expect(c.level).toBe("RED");
    expect(c.levels).toEqual(["RED", "PROTECTION"]);
  });
  it("enforces pending terms but ignores retired ones", () => {
    expect(classifyWithTerms("pregnant, bleeding", terms).level).toBe("RED");
    expect(classifyWithTerms("this term is retired", terms).level).toBe("GREEN");
  });
  it("is GREEN for routine questions", () => {
    expect(classifyWithTerms("What is HPV?", terms).level).toBe("GREEN");
  });
});

describe("postGenerationCheck", () => {
  const ctx = "Some discomfort during menstruation can occur. Severe pain that interferes with normal activities may need assessment by a qualified health professional.";
  it("accepts a grounded paraphrase", () => {
    const r = postGenerationCheck("Some discomfort during menstruation can occur, but severe pain that interferes with normal activities may need assessment by a qualified health professional.", ctx);
    expect(r.ok).toBe(true);
  });
  it("rejects diagnoses, doses, invented numbers and discouraging care", () => {
    expect(postGenerationCheck("You probably have an infection.", ctx).reasons).toContain("diagnostic statement");
    expect(postGenerationCheck("Take 400 mg of ibuprofen.", ctx).reasons.some((r) => r.startsWith("dosage"))).toBe(true);
    expect(postGenerationCheck("Call 0886 555 123 now.", ctx).reasons).toContain("phone number not in approved content");
    expect(postGenerationCheck("There is no need to see a doctor.", ctx).reasons).toContain("discourages professional care");
  });
  it("rejects ungrounded content", () => {
    expect(postGenerationCheck("Drink lemon water with garlic every morning to cure cramps forever.", ctx).ok).toBe(false);
  });
});

describe("stripIdentifiers", () => {
  it("removes emails and phone numbers", () => {
    expect(stripIdentifiers("I am mary@example.com call +231 886 555 123 please")).toBe("I am [removed] call [removed] please");
  });
});
