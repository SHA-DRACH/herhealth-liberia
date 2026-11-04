# Impact methodology (sections 17–19)

## Methodology

Metrics displayed on the HerHealth Liberia Impact page are generated from anonymized prototype events. HerHealth does not publicly display users' health questions, identities or personally identifiable health information. Development activity is separated from structured testing and pilot activity so that public prototype metrics reflect defined testing/pilot usage.

## Environments

Every event (`events.environment`) and AI interaction (`ai_interactions.environment`) is tagged from `APP_ENV`: `development`, `testing`, `pilot` or `production`. The public Impact page and `/api/impact` include only the environments in Settings → `impact_environments` (default `testing,pilot`). Run structured testing sessions on a deployment with `APP_ENV=testing`, and the pilot with `APP_ENV=pilot`. Statistics are calculated at request time from the event tables and cannot be edited.

## Definitions

| Metric | How it is counted |
| --- | --- |
| Anonymous prototype user | Distinct hashed device code. The browser creates a random code on first visit and keeps it only on the device; the server stores an HMAC of it. Clearing browser data creates a new code, so this may over-count. |
| Learning session | Distinct hashed per-tab session code (created when HerHealth is opened in a tab, discarded when the tab closes). |
| Health articles viewed | `article_view` events. |
| Audio lessons played | `audio_started` events (`audio_completed` is also recorded). |
| Questions supported | `question_supported` events: questions answered from approved content, escalated (emergency/protection/crisis), given the medication-safety response or the honest fallback. Out-of-scope questions are not counted. |
| Referral searches | `referral_search` events — each submitted search on Find help. |
| Languages available | Languages selectable by the public; “validated” only when status is APPROVED/PUBLISHED. |
| User usefulness rating | Share of “Yes” among all Yes/No feedback (lessons, answers, feedback page). |
| Safety tests passed | Latest automated safety-suite run (synthetic questions — shown separately from user analytics). |
| Last updated | Time of the most recent counted event. |

## Never published

Raw health questions, individual histories, names, phone numbers or any personally identifiable health information.
