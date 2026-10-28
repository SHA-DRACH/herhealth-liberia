# Data model

Defined in `src/lib/db/schema.ts` (PostgreSQL). Tables follow specification §20 with these additions: `admin_sessions`, `audit_log`, `knowledge_chunks` (retrieval index), `ui_translations`, `safety_terms`, `safety_test_runs`, `safety_test_results`, `usability_tests`.

| Table | Purpose | Notes |
| --- | --- | --- |
| `languages` | Supported and candidate languages | `ACTIVE` = offered to the public |
| `categories` | Health topic categories | Names are UI strings `category.<slug>` |
| `articles` | Article metadata and workflow status | `version` increments when approved text changes |
| `article_translations` | Text, key points, warning signs, audio per language | `source_version` = article version it was translated/reviewed from |
| `knowledge_sources`, `article_sources` | Identifiable sources with licence | ≥1 active source required for review and indexing |
| `content_reviews` | Medical and language review decisions | Includes reviewer and article version |
| `knowledge_chunks` | AI retrieval index | Only written from published content; `tsv` full-text, `embedding` pgvector |
| `facilities` | Facilities and helplines | DB constraint: published ⇒ verified with source |
| `anonymous_sessions` | Random device IDs | No IP or user agent |
| `ai_queries` | One row per question | Keyed hash only, never question text |
| `feedback` | 👍/👎 and comments | Identifiers stripped |
| `analytics_events` | Whitelisted anonymous events | |
| `admin_users`, `admin_sessions`, `audit_log` | Admin access | scrypt hashes, hashed session tokens |
| `ui_translations` | Reviewed interface strings per language | English comes from `locales/en/common.json` |
| `safety_terms` | Red-flag / safeguarding lexicon | `PENDING_REVIEW` / `APPROVED` / `RETIRED` |
| `safety_test_runs`, `safety_test_results` | Stored safety-suite results | |
| `usability_tests` | Research sessions | Consent enforced by `CHECK` |
