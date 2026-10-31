// HerHealth static preview — safety layer and question matching.
// Ported from the full application (src/lib/safety/*, src/lib/ask/pipeline.ts). Runs entirely in
// the browser: questions are never sent anywhere or stored.

/** Provisional safety lexicon (identical to the full app). Awaiting validation by a health professional. */
const TERMS = [
  ["RED", "severe bleed"], ["RED", "heavy bleed"], ["RED", "bleeding heavily"], ["RED", "bleeding a lot"],
  ["RED", "pregnan + bleed"], ["RED", "unconscious"], ["RED", "passed out"], ["RED", "fainted"],
  ["RED", "not breathing"], ["RED", "difficulty breathing"], ["RED", "can't breathe"], ["RED", "cannot breathe"],
  ["RED", "seizure"], ["RED", "convuls"], ["RED", "pregnan + severe"],
  ["PROTECTION", "rape"], ["PROTECTION", "sexual abuse"], ["PROTECTION", "sexually abused"], ["PROTECTION", "abused me"],
  ["PROTECTION", "forced me"], ["PROTECTION", "forced sex"], ["PROTECTION", "violence"], ["PROTECTION", "beats me"],
  ["PROTECTION", "beat me"], ["PROTECTION", "hits me"], ["PROTECTION", "exploit"], ["PROTECTION", "traffick"],
  ["PROTECTION", "paying me + sex"], ["PROTECTION", "pays me + sex"], ["PROTECTION", "pay me + sex"], ["PROTECTION", "sex for money"],
  ["MENTAL_HEALTH_CRISIS", "suicid"], ["MENTAL_HEALTH_CRISIS", "kill myself"], ["MENTAL_HEALTH_CRISIS", "end my life"],
  ["MENTAL_HEALTH_CRISIS", "self harm"], ["MENTAL_HEALTH_CRISIS", "hurt myself"], ["MENTAL_HEALTH_CRISIS", "want to die"],
  ["AMBER", "pain"], ["AMBER", "bleed"], ["AMBER", "discharge"], ["AMBER", "fever"], ["AMBER", "lump"], ["AMBER", "swollen"],
];

const SEVERITY = { GREEN: 0, AMBER: 1, PROTECTION: 2, MENTAL_HEALTH_CRISIS: 3, RED: 4 };

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function phraseMatches(tokens, phrase) {
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (!tokens[i + j].startsWith(phrase[j])) continue outer;
    return phrase.length > 0;
  }
  return false;
}

const termMatches = (tokens, term) => term.split("+").map(normalize).every((p) => phraseMatches(tokens, p));

/** Lexicon classifier: runs before anything else, so emergencies never get an ordinary answer. */
export function classify(question) {
  const tokens = normalize(question);
  const hit = new Set();
  for (const [level, term] of TERMS) if (termMatches(tokens, term)) hit.add(level);
  const levels = [...hit].sort((a, b) => SEVERITY[b] - SEVERITY[a]);
  return { level: levels[0] ?? "GREEN", levels };
}

const MEDICINE = "(?:medicines?|medications?|drugs?|pills?|tablets?|injections?|herbs?|herbal\\s+\\w+|antibiotics?|painkillers?)";
const MEDICATION_PATTERNS = [
  new RegExp(`\\b(?:what|which)\\s+(?:kind\\s+of\\s+|type\\s+of\\s+)?${MEDICINE}\\b`),
  new RegExp(`\\b${MEDICINE}\\s+(?:should|can|must|do)\\s+i\\s+(?:take|use|buy|get)\\b`),
  new RegExp(`\\b(?:give|recommend|prescribe|suggest|tell)\\s+(?:me\\s+)?(?:a\\s+|some\\s+|the\\s+)?${MEDICINE}\\b`),
  /\b(?:dose|doses|dosage|dosing|how\s+many\s+(?:pills|tablets|capsules)|how\s+much\s+(?:medicine|medication))\b/,
  /\bprescri(?:be|ption)\b/,
];
export const isMedicationRequest = (q) => MEDICATION_PATTERNS.some((p) => p.test(normalize(q).join(" ")));

const DOMAIN = [
  "health", "medic", "doctor", "nurse", "midwi", "clinic", "hospital", "symptom", "pain", "bleed", "blood", "body",
  "period", "menstru", "pad", "tampon", "cycle", "pms", "cramp", "puberty", "ovul", "fertil", "infertil", "hormon", "menopaus",
  "pregnan", "baby", "babies", "birth", "deliver", "labour", "labor", "antenatal", "prenatal", "postnatal", "postpartum",
  "miscarr", "abort", "breast", "breastfeed", "newborn", "infant", "child", "matern", "mother", "womb", "uter", "cervi",
  "vagin", "vulv", "penis", "testic", "sperm", "egg", "discharge", "itch", "smell", "infect", "std", "sti", "hiv", "aids",
  "hpv", "herpes", "syphil", "gonorr", "chlamyd", "cancer", "screening", "vaccin", "condom", "contracep", "family",
  "implant", "iud", "injectable", "pill", "sex", "consent", "relationship", "partner", "rape", "abuse", "violen",
  "mental", "stress", "anxi", "depress", "sad", "sleep", "suicid", "wellbeing", "nutrition", "food", "eat", "diet", "weight",
  "fever", "headache", "nause", "vomit", "dizz", "faint", "urin", "pee", "lump", "swell", "swollen", "rash", "sore",
  "woman", "women", "girl", "female", "teen", "adolesc", "worry", "worried", "feel", "mood", "prep", "pep",
];
const domainMatch = (w, p) => (p.length <= 3 ? w === p || w === `${p}s` : w.startsWith(p));
export const isOutOfScope = (q) => !normalize(q).some((w) => DOMAIN.some((p) => domainMatch(w, p)));

// ---------- matching a question to the Q&A library ----------

const STOP = new Set(
  ("a an the and or but if of to in on at for with by from as is are was were be been being it its this that these those you your yours i me my we our " +
    "they them their he she his her can could may might will would should do does did not no so than then there here what when where which who whom why how " +
    "also very just more most some any about into over under such only own same too have has had get got am im i'm want know tell please much many")
    .split(" "),
);

/** Very small English stemmer: enough to match "bleeding"/"bleed", "periods"/"period", "pregnancy"/"pregnant". */
export function stem(w) {
  if (w.startsWith("pregnan")) return "pregnan";
  if (w.startsWith("menstru")) return "menstru";
  if (w.startsWith("contracep")) return "contracep";
  if (w.startsWith("breastfeed")) return "breastfeed";
  for (const s of ["ations", "ation", "ings", "ing", "edly", "ies", "ied", "ed", "ly", "es", "s"]) {
    if (w.length > s.length + 3 && w.endsWith(s)) return s === "ies" || s === "ied" ? w.slice(0, -s.length) + "y" : w.slice(0, -s.length);
  }
  return w;
}

export const keywords = (text) => [...new Set(normalize(text).filter((w) => w.length > 1 && !STOP.has(w)).map(stem))];

/**
 * Scores every Q&A pair against the question. Confidence = share of the question's meaningful words
 * found in the pair (question words count double). Only pairs above the threshold are used.
 */
export function search(question, library, minCoverage = 0.5) {
  const q = keywords(question);
  if (!q.length) return [];
  const results = [];
  for (const item of library) {
    const strong = new Set(keywords(`${item.q} ${item.tags ?? ""} ${item.articleTitle}`));
    const weak = new Set(keywords(item.a));
    let score = 0;
    let found = 0;
    for (const w of q) {
      if (strong.has(w)) {
        score += 2;
        found++;
      } else if (weak.has(w)) {
        score += 1;
        found++;
      }
    }
    const coverage = found / q.length;
    if (coverage >= minCoverage) results.push({ item, coverage, score });
  }
  return results.sort((a, b) => b.coverage - a.coverage || b.score - a.score);
}

/** The full Ask HerHealth decision, in the same order as the full application's pipeline. */
export function ask(question, library) {
  const text = question.trim().slice(0, 500);
  const c = classify(text);
  const special = c.levels.filter((l) => l === "RED" || l === "PROTECTION" || l === "MENTAL_HEALTH_CRISIS");
  const toPathway = { RED: "EMERGENCY", PROTECTION: "PROTECTION", MENTAL_HEALTH_CRISIS: "MENTAL_HEALTH_CRISIS" };
  if (special.length) return { pathway: toPathway[special[0]], risk: c.level, alsoApplies: special.slice(1).map((l) => toPathway[l]) };
  if (isMedicationRequest(text)) return { pathway: "MEDICATION", risk: c.level };
  const matches = search(text, library);
  if (!matches.length) return { pathway: isOutOfScope(text) ? "OUT_OF_SCOPE" : "FALLBACK", risk: c.level };
  return { pathway: "ANSWER", risk: c.level, best: matches[0].item, related: matches.slice(1, 3).map((m) => m.item) };
}
