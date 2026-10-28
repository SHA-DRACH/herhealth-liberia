# Contributing to HerHealth Liberia

Thank you for helping. This project handles sensitive health information for women and girls, so a few rules are stricter than usual.

## Ground rules

1. **No fabricated data.** Never add fake users, facilities, phone numbers, medical sources, translations, test results or statistics — not in seeds, fixtures that reach a real database, screenshots or documentation.
2. **Health content goes through the admin workflow**, not through code. Articles need an identifiable source, medical review and publication by the right roles.
3. **Safety changes need review by a health professional.** Changes to `src/lib/safety/`, the safety lexicon or pathway texts must be reviewed by the project's Health Reviewer.
4. **No new trackers or third-party scripts.** Do not store question text, IP addresses or other identifiers.
5. **Translations come from fluent speakers** and go through language review in the admin.

## Development

```bash
npm install
npm run dev
npm test && npm run typecheck
```

- Database changes: add a new migration to `src/lib/db/schema.ts`; never edit a shipped one.
- Keep pages small and mobile-first; test at 375px width and on a slow connection.
- Every PR must keep `npm test` green, including 100% RED escalation in `tests/safety`.

## Pull requests

Describe what changed and why, how you tested it, and any privacy or safety impact.
