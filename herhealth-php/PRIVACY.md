# HerHealth Liberia — Privacy

HerHealth is designed so women and girls can learn about their health privately.

## What we do not collect

- No public accounts, names, phone numbers or e-mail addresses.
- No IP addresses. Rate limiting stores only a keyed one-way hash for a short window (deleted daily).
- **The text of questions is never stored** — not in the database, logs or analytics.
- No Meta Pixel, advertising trackers, behavioural advertising, third-party analytics or advertising cookies.

## What we collect

| Data | Purpose | Retention |
| --- | --- | --- |
| Anonymous events (app open, lesson viewed, audio played, referral search…) linked to a hashed random device code | Impact measurement | 24 months |
| Ask HerHealth metadata: risk level, pathway, topic, matched lesson, confidence, provider, environment — **no question text** | Safety review | 24 months |
| Feedback (useful yes/no, optional comment with phone numbers/e-mails removed automatically) | Improvement | Comments 12 months |
| Admin audit logs | Security and traceability | 24 months (security need) |
| Encrypted rotating database backups | Recovery | About 30 days |

These periods are the MVP retention schedule, to be formally confirmed by SkillBridge Liberia before publication (Admin → Settings → `retention_confirmed`). `scripts/retention_cleanup.php` applies them automatically.

## Cookies and device storage

- `hh_lang` (functional) — remembers the chosen language.
- Admin only: `hh_admin` session cookie (HttpOnly, SameSite=Strict, Secure on HTTPS).
- On the device: a random device code, a per-tab session code, saved lessons and text size. The privacy page has a button to clear all of it.

## Voice input

The microphone button uses the browser's built-in speech recognition, which may be provided by the phone or browser maker. HerHealth receives only the resulting text and does not store it. Users can always type instead. The setting `voice_input_enabled` can turn the button off.

## User testing

Participants are adults who gave informed consent. Only an anonymous participant ID is recorded — never a name.

## Contact

SkillBridge Liberia Corporation.
