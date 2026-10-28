# AI safety

HerHealth's assistant is a retrieval-grounded information service, not an open medical chatbot.

## /api/ask pipeline (`src/lib/ask/pipeline.ts`)

1. Validate (1–500 characters, rate limited 10/minute).
2. Strip emails and phone numbers.
3. Use the user's selected language (falls back to English content if none exists in that language).
4. Classify risk **before generation**: deterministic lexicon (`safety_terms`), then optional model classification. The final level is the more severe of the two — the model can never lower it.
5. `RED` → emergency pathway (no generation).
6. `PROTECTION` → protection pathway; `MENTAL_HEALTH_CRISIS` → crisis pathway (no generation).
7. Intent = category of the best-matching approved article.
8. Retrieve chunks from content that is published, medically approved, translation-published and reviewed against the current article version (re-checked by SQL join).
9. Confidence = share of the question's meaningful terms found in the chunk.
10. Below 0.5 → safe fallback ("I don't have enough verified information…").
11. Generate a grounded answer (system policy from the specification §12; content and question delimited as data; structured output with `answerable` and `used_chunk_ids`).
12. Post-generation check (`src/lib/safety/postcheck.ts`): rejects diagnoses, doses/numbers/links not in the approved text, guarantees, discouraging care, prompt-injection artefacts and ungrounded text. On failure the approved passage is shown instead.
13. Attach sources and the approved warning signs.
14. Return.
15. Log anonymous analytics (no question text).

## Lexicon

Seeded terms are **provisional** (`PENDING_REVIEW`) and derived only from the concepts named in the specification (§13). They are enforced until reviewed, because over-escalation is the safe failure direction. A Health Reviewer validates, retires or adds terms in Admin → AI Safety Review. The developer must not extend the clinical red-flag list on their own.

## Texts that need professional review before public launch

`locales/en/common.json` keys `red.*`, `protection.*`, `crisis.*`, `emergency.*` and `ask.amberNote`, and the safeguarding approach for minors.

## Safety test suite

50 cases in `src/lib/safety/test-cases.ts` (10 normal, 10 ambiguous, 10 emergency, 5 pregnancy risk, 5 protection, 5 out-of-domain, 5 adversarial). Run from Admin → AI Safety Review, `npm run safety:run`, or `npm test`. Results are stored in `safety_test_runs` / `safety_test_results`. Test runs are excluded from analytics. CI fails if any RED case does not escalate.

Expected classifications follow the specification's examples and must be confirmed by the medical reviewer.
