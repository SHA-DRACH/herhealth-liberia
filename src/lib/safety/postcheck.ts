import { normalize } from "./classifier";

export interface PostCheckResult {
  ok: boolean;
  reasons: string[];
  groundingRatio: number;
}

const STOP = new Set(
  "a an the and or but if of to in on at for with by from as is are was were be been being it its this that these those you your yours i me my we our they them their he she his her can could may might will would should do does did not no so than then there here what when where which who why how also very just more most some any about into over under such only own same too".split(" "),
);

const contentWords = (text: string) => normalize(text).filter((w) => w.length > 2 && !STOP.has(w));

/**
 * Checks a generated answer against the approved passages it was supposed to be grounded in.
 * Any failure means the generated text is discarded and the approved passage is shown instead.
 */
export function postGenerationCheck(answer: string, approvedContext: string): PostCheckResult {
  const reasons: string[] = [];
  const ctx = approvedContext.toLowerCase();
  const a = answer.toLowerCase();

  if (/\byou (definitely |probably |likely |most likely |may |might )?(have|are suffering from|are infected with) (a |an )?([a-z]+ )?(infection|disease|cancer|hiv|sti|std|condition|syndrome|disorder|miscarriage|ectopic)/.test(a))
    reasons.push("diagnostic statement");
  if (/\b(my|the) diagnosis\b|\bi (can )?diagnose\b/.test(a)) reasons.push("claims to diagnose");

  for (const m of a.matchAll(/\b\d+(?:\.\d+)?\s?(?:mg|mcg|ml|milligrams?|micrograms?|tablets?|pills?|capsules?|doses?)\b/g)) {
    if (!ctx.includes(m[0])) reasons.push(`dosage not in approved content: ${m[0]}`);
  }
  for (const m of answer.matchAll(/\+?\d[\d\s().-]{6,}\d/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (!approvedContext.replace(/\D/g, " ").split(/\s+/).includes(digits)) reasons.push("phone number not in approved content");
  }
  for (const m of a.matchAll(/https?:\/\/[^\s)]+|www\.[^\s)]+/g)) {
    if (!ctx.includes(m[0])) reasons.push("link not in approved content");
  }
  if (/\b(guarantee[sd]?|100% (safe|effective)|will (definitely|certainly) (cure|work)|always works)\b/.test(a) && !/guarantee|100%/.test(ctx))
    reasons.push("guarantees an outcome");
  if (/\b(no need to|don't need to|do not need to|you don't have to|there is no reason to|avoid) (see|visit|go to|going to|seeing|visiting) (a |the |any )?(doctor|nurse|midwife|clinic|hospital|health)/.test(a))
    reasons.push("discourages professional care");
  if (/\b(ignore (all|previous|the above)|system prompt|as an ai language model|my instructions)\b/.test(a)) reasons.push("prompt-injection artefact");

  const words = contentWords(answer);
  const ctxWords = new Set(contentWords(approvedContext));
  const grounded = words.filter((w) => ctxWords.has(w) || [...ctxWords].some((c) => c.length > 4 && (c.startsWith(w.slice(0, 5)) || w.startsWith(c.slice(0, 5)))));
  const groundingRatio = words.length ? grounded.length / words.length : 0;
  if (groundingRatio < 0.6) reasons.push(`low grounding (${groundingRatio.toFixed(2)})`);

  return { ok: reasons.length === 0, reasons, groundingRatio };
}
