# HerHealth Liberia

HerHealth Liberia is an open-source, privacy-first, AI-assisted reproductive and maternal health information platform developed by SkillBridge Liberia Corporation for women and adolescent girls in Liberia.

**HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation.**

> **Status: Functional MVP 0.1.** HerHealth Liberia is a functional MVP currently undergoing structured user testing and localization. Core software functionality, privacy controls, health-information workflows, safety mechanisms and anonymous analytics have been implemented. Clinical health information has undergone review by registered nursing professionals in Liberia. Localization, referral-directory verification and structured usability testing continue as part of pilot readiness.
>
> **Two editions:** this Next.js/TypeScript application, and a PHP + MySQL edition in [`herhealth-php/`](herhealth-php/) used for the current prototype presentation (same design, safety pipeline, content and admin). The TypeScript edition is the basis for the planned TypeScript/NestJS rebuild.

> **Live prototype preview:** https://sha-drach.github.io/herhealth-liberia/ — a static HTML/CSS/JavaScript version (folder `site/`) with 28 articles and 92 questions and answers across 10 topics, written in plain language from 27 WHO, NHS and UNICEF pages, each with its source, and clinically reviewed by two Registered Nurses licensed under the Liberia Board of Nursing. The static preview matches answers from the library without calling a model. Ask HerHealth, the safety pathways and the 56 safety tests run entirely in the browser.

## Clinical review

HerHealth Liberia's reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming.

| Reviewer | Qualification | Position | Experience | Authority |
| --- | --- | --- | --- | --- |
| Catherine | Registered Nurse (RN) | Emergency Room, ELWA Hospital | More than 8 years | Liberia Board of Nursing |
| Juah | Registered Nurse (RN) | Gender Officer, National WASH Commission (NWASHC) | More than 6 years | Liberia Board of Nursing |

Together the reviewers bring more than 14 years of professional experience. Surnames, licence numbers and review dates will be added when verified information is supplied; licence numbers are kept internally and not published without consent. The register is in Admin → Clinical Reviews (`clinical_reviews`, migration 4). HerHealth makes no claim of a clinical trial, medically certified AI, AI diagnosis, or government, Ministry of Health or UNICEF approval.

## Problem

Women and adolescent girls in Liberia often lack private, trustworthy reproductive-health information in a language and format they understand, especially on low-cost phones and poor connections.

## Solution

A mobile-first Progressive Web App that lets users **learn** (short, medically reviewed articles), **listen** (human-recorded audio), **ask** (a grounded AI assistant that answers only from approved content) and **find help** (manually verified services). No login, no name, no phone number.

## Target users

Women and adolescent girls in Liberia. Usability testing starts with adults (18+) unless approved safeguarding procedures for minors are in place.

## Features

| Module | Status |
| --- | --- |
| Health education (categories, articles, key points, warning signs, sources) | ✅ |
| Local-language/audio content (database-driven languages, audio + transcript, offline save) | ✅ |
| Ask HerHealth — safety-classified, retrieval-grounded assistant | ✅ |
| Find Help — verified facility and helpline directory | ✅ |
| Anonymous feedback and usability-testing module | ✅ |
| Admin dashboard, analytics and public `/impact` page | ✅ |
| Diagnosis, prescriptions, telemedicine, medical records, payments | ❌ out of scope |

## Technology architecture

- **Next.js 15 + TypeScript + Tailwind CSS**, mobile-first PWA with a hand-written service worker (`public/sw.js`).
- **PostgreSQL + pgvector** in production (`DATABASE_URL`). For local development and tests the same schema runs on **PGlite** (PostgreSQL compiled to WebAssembly) — no database install needed.
- **Provider-independent AI layer supporting approved LLM providers** (`src/lib/ai/provider.ts`): `generate()`, `embed()`, `classify()`. Ships with `none` (answers with the exact approved passage) and an adapter for one commercial provider; others can be added behind the same interface. HerHealth's innovation is the system around the model: controlled health knowledge, RAG, deterministic safety classification, clinical review, localization, privacy, low-bandwidth delivery, referral architecture and anonymous impact measurement.
- **Retrieval**: PostgreSQL full-text search over approved chunks; every chunk carries `article_id`, title, language, medical review status, version, source and `updated_at`.

See [docs/architecture.md](docs/architecture.md) and [docs/data-model.md](docs/data-model.md).

## AI safety

The assistant is not a chatbot. Every question goes through: validation → identifier stripping → **safety classification before any model call** → emergency / protection / crisis pathways that bypass generation → retrieval from **published, medically approved** content only → confidence check with a safe fallback → grounded generation → **post-generation check** → sources → anonymous analytics. A model can only raise a risk level, never lower it. See [docs/ai-safety.md](docs/ai-safety.md).

Latest automated result on the deterministic layer (no AI model, empty knowledge base): **55/56 safety cases pass and 18/18 RED scenarios escalate.** Medicine requests get a fixed no-prescribing response and non-health questions are declined as out of scope. The remaining case (`SAFETY-021`, "very heavy flow") is medically ambiguous: it has **not** been changed to pass and is awaiting the registered nurses' decision on the classification and escalation wording (see [docs/ai-safety.md](docs/ai-safety.md)). Target: 100% of medically validated scenarios, including 100% of RED scenarios.

## Privacy

No accounts for the public, no IP addresses, no advertising or third-party trackers, and **raw questions are never stored** (only a keyed hash, topic and risk level). Users can clear their session and downloads at any time. See [PRIVACY.md](PRIVACY.md).

## Localization

UI strings: `locales/en/common.json` is the source; other languages are translated and reviewed in the admin and stored in the database. Articles are database-driven per language. A language is offered publicly only after review. No machine translation is published. See [docs/localization.md](docs/localization.md).

## Installation

Requires Node.js 20+.

```bash
npm install
cp .env.example .env        # optional for local development
npm run dev                 # http://localhost:3000, admin at /admin/login
```

**First admin sign-in:** on first start with no admin accounts, the app creates `admin@herhealth.local` and prints a one-time password once in the server terminal (or uses `ADMIN_DEFAULT_PASSWORD` from `.env`). You must choose a new password at first sign-in. No password is stored in the repository. More team accounts can be added in Admin → Users & Roles, or with `npm run admin:create` (with the embedded database, while the dev server is stopped). For production see [docs/deployment.md](docs/deployment.md).

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/languages` | Languages offered to the public |
| GET | `/api/categories` | Categories with published-article counts |
| GET | `/api/articles?category=` | Published articles in a category |
| GET | `/api/articles/:slug` | One published article with sources |
| POST | `/api/ask` | Ask HerHealth (`{question, language, sessionId}`) |
| GET | `/api/facilities` · `/api/facilities/:id` | Verified, published services |
| POST | `/api/feedback` | 👍/👎 or comment |
| POST | `/api/events` | Whitelisted anonymous events |
| DELETE | `/api/session` | Clear this session |
| GET | `/api/public/impact` | Aggregated, anonymous impact metrics |
| POST | `/api/admin/login` | Admin sign-in |
| GET | `/api/admin/dashboard` · `analytics` · `testing` · `ai-reviews` | Admin data (role-checked) |

Admin create/update operations (articles, translations, facilities, sources, safety terms, users) are implemented as authenticated, role-checked, audit-logged server actions in `src/app/admin/actions.ts`.

## Testing

```bash
npm test             # unit, integration (real PostgreSQL schema in memory) and safety suites
npm run typecheck
npm run safety:run   # runs the 50 safety cases against the configured database + AI provider and stores the results
```

Usability sessions are recorded in **Admin → Testing**. See [docs/testing.md](docs/testing.md).

## Open data / impact metrics

`/impact` and `/api/public/impact` are computed live from application events. They contain no personal data, no questions and no individual histories.

## What the team must supply

1. Verified surnames, licence numbers and review dates for the clinical reviewers (Catherine, RN and Juah, RN), and their decision on `SAFETY-021`.
2. Medical validation of the provisional red-flag lexicon and the emergency/protection/crisis pathway texts (Admin → AI Safety Review), plus safeguarding review before any public use by minors.
3. A fluent translator and Language Reviewer for Liberian English and one pilot language, and human-recorded audio.
4. Manually verified facilities and helplines.
5. 15–25 consenting adult testers; record each session in Admin → Testing.
6. Hosting, PostgreSQL with pgvector, `APP_SECRET`, and optionally an AI provider key.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

Software: [MIT](LICENSE). Original SkillBridge educational content may be released under CC BY 4.0 where SkillBridge owns it; third-party health content keeps its original licence and is recorded per source in the admin.

## About SkillBridge Liberia

HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation, an applicant to the UNICEF FemTech programme. HerHealth is not funded, supported, approved or endorsed by UNICEF.
