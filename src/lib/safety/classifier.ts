export const RISK_LEVELS = ["GREEN", "AMBER", "RED", "PROTECTION", "MENTAL_HEALTH_CRISIS"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Higher number wins when several levels match. */
const SEVERITY: Record<RiskLevel, number> = {
  GREEN: 0,
  AMBER: 1,
  PROTECTION: 2,
  MENTAL_HEALTH_CRISIS: 3,
  RED: 4,
};

export interface SafetyTerm {
  term: string;
  risk_level: Exclude<RiskLevel, "GREEN">;
  status: string;
}

export interface Classification {
  level: RiskLevel;
  /** Every level that matched, most severe first. */
  levels: RiskLevel[];
  matchedTerms: string[];
}

export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function phraseMatches(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0) return false;
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) {
      if (!tokens[i + j].startsWith(phrase[j])) continue outer;
    }
    return true;
  }
  return false;
}

/** "a b" = phrase; "a + b" = both parts present anywhere; each word matches as a prefix. */
export function termMatches(tokens: string[], term: string): boolean {
  return term
    .split("+")
    .map((part) => normalize(part))
    .every((phrase) => phraseMatches(tokens, phrase));
}

export function moreSevere(a: RiskLevel, b: RiskLevel): RiskLevel {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/**
 * Deterministic lexicon classifier. Runs before any model is called, so emergency and
 * protection questions never reach normal AI generation. Retired terms are ignored;
 * pending and approved terms are both enforced (over-escalation is the safe direction).
 */
export function classifyWithTerms(text: string, terms: SafetyTerm[]): Classification {
  const tokens = normalize(text);
  const hit = new Set<RiskLevel>();
  const matchedTerms: string[] = [];
  for (const t of terms) {
    if (t.status === "RETIRED") continue;
    if (termMatches(tokens, t.term)) {
      hit.add(t.risk_level);
      matchedTerms.push(t.term);
    }
  }
  const levels = [...hit].sort((a, b) => SEVERITY[b] - SEVERITY[a]);
  return { level: levels[0] ?? "GREEN", levels, matchedTerms };
}
