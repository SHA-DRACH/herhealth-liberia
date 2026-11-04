# HerHealth Liberia

HerHealth Liberia is an open-source, privacy-first, AI-assisted reproductive and maternal health information platform developed by SkillBridge Liberia Corporation for women and adolescent girls in Liberia.

**HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation.**

> **Status: Functional MVP 0.1.** HerHealth Liberia is a functional MVP currently undergoing structured user testing and localization. Core software functionality, privacy controls, health-information workflows, safety mechanisms and anonymous analytics have been implemented. Clinical health information has undergone review by registered nursing professionals in Liberia. Localization, referral-directory verification and structured usability testing continue as part of pilot readiness.

This folder is the **PHP + MySQL edition** used for the current prototype presentation (HTML5, CSS, vanilla JavaScript, PHP 8, MySQL/MariaDB). The TypeScript/Next.js edition in the parent repository follows the same design and is the basis for the planned TypeScript/NestJS rebuild.

HerHealth provides educational health information and does not provide medical diagnosis or replace consultation with a qualified healthcare professional.

---

## Problem

Women and adolescent girls in Liberia often cannot get private, trustworthy reproductive and maternal health information in a language and format they understand. Distance to facilities, stigma, low literacy, low-cost phones and weak or expensive internet all make it harder to know what is normal, what is dangerous and where to go for care.

## Solution

A mobile-first Progressive Web App where a user can:

- **Learn** — short, plain-language lessons, clinically reviewed by registered nurses, each with its sources.
- **Listen** — audio lessons for people who prefer to listen (human recordings, or the phone's own voice reading the reviewed text, with a transcript).
- **Ask** — type or speak a question; HerHealth answers only from approved content, shows the source, and escalates emergencies instead of answering.
- **Find help** — a small directory of health services that the team has verified by phone or visit.

No account, no name and no phone number are needed. A **Quick Exit** button is always visible.

## Current MVP Status

| Area | Status |
| --- | --- |
| Health content (28 articles, 92 Q&A passages, 27 sources) | Implemented; clinically reviewed by two Registered Nurses |
| Clinical review register | Implemented (Catherine, RN; Juah, RN). Surnames, licence numbers and review dates to be added when verified information is supplied |
| AI safety suite | 55/56 passing, 18/18 RED escalated. SAFETY-021 (“very heavy flow”) awaits the nurses' decision — see [docs/ai-safety.md](docs/ai-safety.md) |
| English | Published |
| Liberian English | Interface drafted, **under language review**; lessons shown in English until reviewed translations exist |
| Indigenous language | Not added — only if it can be properly validated |
| Audio | Device-voice audio for 7 priority lessons; upload of human recordings implemented (none recorded yet) |
| Verified referral directory | 9 facilities in Montserrado, Bong, Margibi and Grand Bassa listed **for verification**; 0 verified yet, so none are shown publicly |
| Structured user testing | Module implemented; sessions not yet recorded |
| Admin dashboard | Implemented with CRUD, CSV/JSON export, print, audit log |

## Features

- Privacy introduction → language choice → home, on first visit.
- Learn by topic, search, article pages with clinical-review badge, version, sources, key points and “when to get help”.
- Audio player above the article (never autoplays), transcript, `audio_started` / `audio_completed` events.
- Save lessons for offline reading; app shell cached by a service worker.
- Ask HerHealth with text or voice input, grounded answers with source attribution, “read answer aloud”.
- Emergency, protection, mental-health crisis, medication and out-of-scope pathways.
- Verified-only facility search by county and service.
- Anonymous feedback, public Impact page with methodology.
- Admin: Dashboard (with live submission-readiness checklist), Health Content (workflow + version history), Clinical Reviews, Translations, Languages, Audio, Knowledge Sources, Knowledge Passages, Categories, Facilities, AI Safety Review, AI Interactions, Feedback, Analytics, Testing, Users & Roles, Settings, Audit Log. Every list exports to CSV (Excel) and JSON and can be printed.

Not included before submission (roadmap only): telemedicine, video consultation, medical records, user profiles, appointment booking, payments, pharmacy ordering, menstrual prediction, national facility mapping, community chat, complex registration.

## Clinical Review

HerHealth Liberia's reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming.

| Reviewer | Qualification | Position | Experience | Authority |
| --- | --- | --- | --- | --- |
| Catherine | Registered Nurse (RN) | Emergency Room, ELWA Hospital | More than 8 years | Liberia Board of Nursing |
| Juah | Registered Nurse (RN) | Gender Officer, National WASH Commission (NWASHC) | More than 6 years | Liberia Board of Nursing |

Together the reviewers bring more than 14 years of professional experience. Licence numbers are kept internally for due diligence and are not published without the reviewer's consent. HerHealth makes no claim of a clinical trial, medically certified AI, AI diagnosis, or government, Ministry of Health or UNICEF approval. See [docs/clinical-review.md](docs/clinical-review.md).

## Architecture

```
public/            web root: index.php (front controller), assets, sw.js, manifest, uploads/audio
app/               bootstrap, Db (PDO), Auth, I18n, Safety + Retrieval, Ai (provider layer), AskPipeline,
                   Analytics, Content, SafetySuite, api.php, public_routes.php, admin/ (routes + resource definitions)
views/             public and admin templates (plain PHP, escaped output)
locales/           en.json, lir-en.json, pilot-language/ — UI strings kept outside application logic
database/          schema.sql (InnoDB, utf8mb4, foreign keys), seed.php, seed-content.json
scripts/           run_safety_suite.php, retention_cleanup.php, secret_scan.php, create_admin.php, backup.sh
tests/             run_tests.php (pipeline, privacy, referral, Quick Exit and caching checks)
docs/              safety, clinical review, localization, impact methodology, testing, security, demo script
```

**Provider-independent AI layer supporting approved LLM providers.** `AI_PROVIDER=none` (default) returns the exact clinically approved passage; `anthropic` or `openai` (any OpenAI-compatible endpoint, including self-hosted models) only rephrase the approved passages they are given, and every output is post-checked. HerHealth's innovation is the system around the model: controlled health knowledge, retrieval-augmented generation, deterministic safety classification, clinical review, localization, privacy, low-bandwidth delivery, referral architecture and anonymous impact measurement.

Database: 28 tables — see [database/schema.sql](database/schema.sql). Key groups: content (`articles`, `article_versions`, `article_sources`, `article_clinical_reviews`, `knowledge_chunks`, `article_translations`, `audio_lessons`), clinical (`clinical_reviews`), referrals (`facilities`, `facility_services`), safety (`safety_terms`, `safety_cases`, `safety_runs`, `safety_results`, `safety_messages`, `ai_interactions`), evidence (`events`, `feedback`, `user_tests`, `user_test_tasks`, `testing_changes`), system (`admin_users`, `audit_logs`, `settings`, `rate_limits`, `languages`).

## AI Safety

Ask HerHealth is not a general chatbot. Every question follows this fixed pipeline:

user question → input validation → identifier stripping → language detection → **safety classification** → intent classification → approved knowledge retrieval → confidence threshold → grounded AI generation → post-generation safety check → source attribution → anonymous analytics.

RED/emergency, protection and crisis cases bypass retrieval and generation. The AI must not diagnose, prescribe, invent treatment, facilities, emergency numbers or sources, guarantee outcomes or discourage professional care. Latest run: **55/56 cases pass, 18/18 RED scenarios escalate**; the remaining case is medically ambiguous and is waiting for the registered nurses' decision (it has not been changed just to pass). See [docs/ai-safety.md](docs/ai-safety.md).

## Privacy

No public accounts; no names, phone numbers or IP addresses stored; **raw questions are never stored**; no Meta Pixel, advertising trackers, third-party analytics or advertising cookies. One functional cookie (`hh_lang`) stores the language. Retention: anonymous analytics 24 months, AI metadata 24 months, feedback comments 12 months, audit logs 24 months, encrypted rotating backups about 30 days — pending formal adoption by SkillBridge. See [PRIVACY.md](PRIVACY.md).

## Localization

English is published. Liberian English interface wording is drafted and clearly labelled “under language review” until a fluent reviewer and a health-terminology reviewer approve it. Health lessons are never machine-translated; they appear in English until a translation passes: draft → fluent/native reviewer → health terminology review → comprehension check → APPROVED → published. One indigenous language will be added only if it can be validated properly. See [docs/localization.md](docs/localization.md).

## Low-Bandwidth Design

No frameworks or web fonts; one small CSS and JS file each (served locally, cached); system fonts; inline SVG icons; server-rendered HTML that works without JavaScript; service worker caching the app shell and visited/saved lessons; device text-to-speech so audio lessons need no download; compressed human recordings (32–64 kbps mono, max 8 MB); reduced-motion support; no autoplay.

## Testing

```bash
php scripts/run_safety_suite.php                         # full safety suite, evidence saved to storage/evidence/
BASE_URL=http://127.0.0.1:8080 php tests/run_tests.php   # 34 automated checks
php scripts/secret_scan.php                              # search for accidental secrets
```

Structured usability testing (15–25 consenting adults, five tasks) is recorded in Admin → Testing; results come only from recorded sessions. See [docs/testing.md](docs/testing.md).

## Impact Metrics

The public `/impact` page is computed live from anonymous events in the approved environments (default: testing and pilot). Development traffic is excluded. Numbers cannot be edited by hand. See [docs/impact-methodology.md](docs/impact-methodology.md).

## Installation

Requirements: PHP 8.0+ (pdo_mysql, mbstring, fileinfo, curl), MySQL 5.7+ or MariaDB 10.3+.

```bash
cp .env.example .env            # set APP_SECRET, database credentials, ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD
php database/seed.php           # creates tables and loads reference content (use --force to recreate)
php -S 127.0.0.1:8080 -t public public/index.php     # or point Apache's DocumentRoot at public/
```

Open http://127.0.0.1:8080 and the admin at `/admin`. The first admin must change the password at first sign-in. Create the database user with only `SELECT, INSERT, UPDATE, DELETE` on the HerHealth database in production (schema changes are run with a separate account). Set `APP_ENV=testing` for structured testing sessions and `APP_ENV=pilot` for the pilot so their events are separated from development. Schedule `scripts/retention_cleanup.php` daily and `scripts/backup.sh` for encrypted backups. See [docs/deployment.md](docs/deployment.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Never add fabricated data, facilities, phone numbers, translations, test results or statistics.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

Software: [MIT](LICENSE). Third-party health information (WHO, UNICEF, NHS and others) is paraphrased with attribution and keeps its original licence; SkillBridge's content licence is not applied to it. Citing an organization does not imply its endorsement.

## About SkillBridge Liberia

SkillBridge Liberia Corporation builds practical digital solutions for Liberian communities. HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation, which is an applicant to the UNICEF FemTech programme. HerHealth is not funded, supported, approved or endorsed by UNICEF.
