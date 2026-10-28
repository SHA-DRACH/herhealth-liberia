# Testing

## Automated

```bash
npm test
```

- `tests/unit` — classifier, post-generation check, identifier stripping.
- `tests/integration` — the real schema in an in-memory PostgreSQL: drafts are never retrieved; sources required before review; authors cannot approve their own work; editing approved text removes it from retrieval; translations need terminology + comprehension checks and a different reviewer; RED bypasses generation; the model cannot lower risk; unsafe generated answers are replaced; analytics never contain question text. Fixtures exist only in the throwaway in-memory database.
- `tests/safety` — the 50-case suite on the deterministic layer; asserts 100% RED escalation and prints every other failure.

- `tests/integration/sponsor-scenarios.test.ts` — the four review scenarios: HPV question (declines on an empty knowledge base; answers with source once approved content exists), pregnant + heavy bleeding (RED emergency pathway), medicine to terminate a pregnancy (MEDICATION pathway, no drugs or doses), car transmission (OUT_OF_SCOPE).

## Keeping evidence clean

Every session, event, question and rating carries `environment` = development | testing | pilot | production. Signed-in team browsers are always `development`. Before a usability session, use **Admin → Testing → Start participant mode on this device**: it signs the facilitator out, gives the participant a fresh anonymous ID and records their activity as `testing`. `/impact` counts only `PUBLIC_IMPACT_ENVIRONMENTS` (default testing, pilot, production).

## Usability (specification §34)

Five tasks per tester: find when to seek help for menstrual problems; listen to an article; ask a question; find a health service; change the language. Then ease (1–5), understandability (1–5), usefulness (Yes/No/Unsure), difficulties and improvements. Record each session in **Admin → Testing** with an anonymous participant code and confirmed consent. The page computes the real completion, understandability and usefulness rates against the targets (≥80%).

Report the real numbers, including low ones, and what was fixed.

## Before submission

- 15–25 adult testers recorded.
- Safety suite run with the production AI provider configured; 100% RED escalation.
- Mobile test at 375px, slow-network test (Chrome DevTools "Slow 3G"), keyboard and screen-reader pass.
