# Architecture

```
Phone browser (PWA, service worker)
        │  HTTPS
        ▼
Next.js app ── public pages (/, /learn, /article, /ask, /help, /impact, /menu, /privacy)
        │     admin pages (/admin/*, server actions, role-checked, audit-logged)
        │     JSON API (/api/*)
        ├── src/lib/ask/pipeline.ts   ← /api/ask
        │       ├── src/lib/safety/classifier.ts  (lexicon, before any model)
        │       ├── src/lib/content/knowledge.ts  (approved-only retrieval)
        │       ├── src/lib/ai/provider.ts        (generate / embed / classify)
        │       └── src/lib/safety/postcheck.ts   (post-generation check)
        ├── src/lib/content/workflow.ts  (DRAFT → MEDICAL_REVIEW → APPROVED → PUBLISHED; translations)
        ├── src/lib/analytics.ts         (anonymous events, impact metrics)
        └── src/lib/db                   (PostgreSQL via pg, or PGlite locally)
```

## Repository layout and the specification

The specification suggests `apps/web`, `apps/admin` and `packages/*`. Because the admin lives on the same domain (`/admin`) and shares the database and domain logic, this MVP is a single Next.js app with the packages as modules:

| Spec package | Module |
| --- | --- |
| `packages/ai` | `src/lib/ai/` |
| `packages/safety` | `src/lib/safety/` |
| `packages/localization` | `src/lib/i18n.ts`, `locales/` |
| `packages/analytics` | `src/lib/analytics.ts`, `src/lib/admin/stats.ts` |
| `packages/ui` | `src/components/` |
| `database/migrations` | `src/lib/db/schema.ts` |
| `content/*` | database (articles are edited and reviewed in the admin, never committed) |

Splitting into a monorepo later is mechanical because these modules have no framework dependencies except `next/headers` in `i18n.ts` and `admin/auth.ts`.

## Databases

`DATABASE_URL` set → PostgreSQL (must allow `CREATE EXTENSION vector`). Unset → PGlite stored in `./data/pglite` (or `PGLITE_DATA_DIR`). Migrations run automatically on first connection. PGlite allows one process at a time.

## AI providers

`AI_PROVIDER=none` (default): answers are the exact text of the best approved passage. `AI_PROVIDER=anthropic` with `ANTHROPIC_API_KEY`: Claude (`AI_MODEL`, default `claude-opus-5-5`) rephrases approved passages via schema-validated structured output and adds a second-opinion risk classification. Any refusal, error or failed check falls back to approved text. The `embed()` hook and the `knowledge_chunks.embedding` pgvector column are ready for an embedding provider; until one is configured, retrieval uses PostgreSQL full-text search.

## Offline

`public/sw.js` caches the app shell, static assets, visited Home/Learn/Help/Emergency pages, articles the user saves, and audio the user downloads. It never caches `/ask`, `/api/*` (except saved audio) or `/admin`.
