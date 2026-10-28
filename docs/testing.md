# Testing

## Automated

```bash
npm test
```

- `tests/unit` — classifier, post-generation check, identifier stripping.
- `tests/integration` — the real schema in an in-memory PostgreSQL: drafts are never retrieved; sources required before review; authors cannot approve their own work; editing approved text removes it from retrieval; translations need terminology + comprehension checks and a different reviewer; RED bypasses generation; the model cannot lower risk; unsafe generated answers are replaced; analytics never contain question text. Fixtures exist only in the throwaway in-memory database.
- `tests/safety` — the 50-case suite on the deterministic layer; asserts 100% RED escalation and prints every other failure.

## Usability (specification §34)

Five tasks per tester: find when to seek help for menstrual problems; listen to an article; ask a question; find a health service; change the language. Then ease (1–5), understandability (1–5), usefulness (Yes/No/Unsure), difficulties and improvements. Record each session in **Admin → Testing** with an anonymous participant code and confirmed consent. The page computes the real completion, understandability and usefulness rates against the targets (≥80%).

Report the real numbers, including low ones, and what was fixed.

## Before submission

- 15–25 adult testers recorded.
- Safety suite run with the production AI provider configured; 100% RED escalation.
- Mobile test at 375px, slow-network test (Chrome DevTools "Slow 3G"), keyboard and screen-reader pass.
