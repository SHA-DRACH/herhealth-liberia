import { normalize } from "./classifier";

/**
 * Product-scope rules (not clinical rules). They decide which questions HerHealth must decline
 * to answer as an information service; they never diagnose or grade symptoms.
 */

const MEDICINE = "(?:medicines?|medications?|drugs?|pills?|tablets?|injections?|herbs?|herbal\\s+\\w+|antibiotics?|painkillers?)";

/** Requests to choose, dose or prescribe a medicine. HerHealth never recommends medicines or doses. */
const MEDICATION_PATTERNS = [
  new RegExp(`\\b(?:what|which)\\s+(?:kind\\s+of\\s+|type\\s+of\\s+)?${MEDICINE}\\b`),
  new RegExp(`\\b${MEDICINE}\\s+(?:should|can|must|do)\\s+i\\s+(?:take|use|buy|get)\\b`),
  new RegExp(`\\b(?:give|recommend|prescribe|suggest|tell)\\s+(?:me\\s+)?(?:a\\s+|some\\s+|the\\s+)?${MEDICINE}\\b`),
  /\b(?:dose|doses|dosage|dosing|how\s+many\s+(?:pills|tablets|capsules)|how\s+much\s+(?:medicine|medication))\b/,
  /\bprescri(?:be|ption)\b/,
];

export function isMedicationRequest(question: string): boolean {
  const q = normalize(question).join(" ");
  return MEDICATION_PATTERNS.some((p) => p.test(q));
}

/** Word prefixes that indicate a question is within reproductive, sexual, maternal or related health. */
const DOMAIN_PREFIXES = [
  "health", "medic", "doctor", "nurse", "midwi", "clinic", "hospital", "symptom", "pain", "bleed", "blood", "body",
  "period", "menstru", "pad", "tampon", "cycle", "pms", "cramp", "puberty", "ovul", "fertil", "infertil", "hormon", "menopaus",
  "pregnan", "baby", "babies", "birth", "deliver", "labour", "labor", "antenatal", "prenatal", "postnatal", "postpartum",
  "miscarr", "abort", "breast", "breastfeed", "newborn", "infant", "child", "matern", "mother", "womb", "uter", "cervi",
  "vagin", "vulv", "penis", "testic", "sperm", "egg", "discharge", "itch", "smell", "infect", "std", "sti", "hiv", "aids",
  "hpv", "herpes", "syphil", "gonorr", "chlamyd", "cancer", "screening", "vaccin", "condom", "contracep", "family",
  "implant", "iud", "injectable", "pill", "sex", "consent", "relationship", "partner", "rape", "abuse", "violen",
  "mental", "stress", "anxi", "depress", "sad", "sleep", "suicid", "wellbeing", "nutrition", "food", "eat", "diet", "weight",
  "fever", "headache", "nause", "vomit", "dizz", "faint", "urin", "pee", "lump", "swell", "swollen", "rash", "sore",
  "woman", "women", "girl", "female", "teen", "adolesc",
];

/** True when no word in the question relates to the health topics HerHealth covers. */
export function isOutOfScope(question: string): boolean {
  // Short entries (sti, hiv, pad, eat …) must match a whole word (optionally plural), not a prefix of "still".
  const matches = (w: string, p: string) => (p.length <= 3 ? w === p || w === `${p}s` : w.startsWith(p));
  return !normalize(question).some((w) => DOMAIN_PREFIXES.some((p) => matches(w, p)));
}
