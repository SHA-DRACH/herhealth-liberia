# Contributing to HerHealth Liberia

HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation. This project handles sensitive health information for women and girls, so some rules are stricter than usual.

1. **No fabricated data.** Never add fake users, facilities, phone numbers, sources, translations, test results or statistics.
2. **Health content goes through the admin workflow** (draft → clinical review → approved → translation → language review → published), not through code.
3. **Safety changes need clinical review.** Changes to the safety lexicon, pathway texts or expected test results must be decided by the clinical reviewers and recorded in Admin → AI Safety Review. Never change a test only to make it pass.
4. **No trackers or third-party scripts.** Do not store question text, IP addresses or other identifiers.
5. **Translations come from fluent speakers** and are reviewed before publication. No machine translation is published as approved.

## Development

```bash
cp .env.example .env && php database/seed.php
php -S 127.0.0.1:8080 -t public public/index.php
BASE_URL=http://127.0.0.1:8080 php tests/run_tests.php && php scripts/run_safety_suite.php
```

Test at 375px width, with a slow connection, with keyboard only and with a screen reader where possible.
