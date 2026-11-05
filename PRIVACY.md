# Privacy

This describes what the software does. Keep it in sync with the code and with the in-app notice at `/privacy`.

## Public users

- No account, name, phone number, email, date of birth or national ID is requested.
- The browser stores a random UUID (`hh.session` in localStorage), the chosen language (`hh_lang` cookie), an onboarding flag, text-size preference and the list of articles saved offline.
- **IP addresses and user agents are not stored.** Rate limiting keeps a truncated hash of the address in process memory for one minute only.
- **Question text is never stored.** `ai_queries` keeps the topic, risk level, outcome, retrieval score, provider and an HMAC of the normalised question (keyed with `APP_SECRET`).
- Questions are sent to the configured AI provider only when `AI_PROVIDER` is set, after emails and phone numbers are removed. Emergency, protection and crisis questions are never sent for generation; they may be sent for a second-opinion classification.
- Feedback comments are free text with emails and phone numbers removed automatically.
- Analytics events are whitelisted (`src/lib/analytics.ts`); metadata is limited to short, non-free-text values such as an article slug or county.
- "Clear this session" deletes feedback comments, unlinks every event and query from the ID, and removes it from the device. Aggregate counts remain so public metrics stay truthful.
- Sensitive AI conversations are never cached by the service worker or stored on the device.
- No advertising trackers, Meta Pixel, third-party analytics, fonts or scripts. A strict Content-Security-Policy blocks third-party resources.

## Admin users and research participants

- Admin accounts store name, email, scrypt password hash, role and last sign-in. Sessions are random tokens stored hashed, 8-hour expiry, `HttpOnly`, `SameSite=Strict` cookies.
- Every admin mutation is written to `audit_log`.
- Usability tests record an anonymous participant code, age range, device and answers — never names. Consent confirmation is required by the database.

## Retention schedule (MVP)

| Data | Retention |
| --- | --- |
| Anonymous analytics events | 24 months |
| AI interaction metadata (no question text) | 24 months |
| Feedback comments | 12 months |
| Administrative audit logs | 24 months (security need) |
| Admin sessions | Deleted on expiry |
| Encrypted rotating backups | About 30 days |
| Raw health questions | Never stored |

These periods are to be formally adopted by SkillBridge Liberia before publication. Raw health questions are not retained for analytics or any other purpose.

## Never commit

`.env`, API keys, database passwords, user questions, participant information, production backups, private keys or admin credentials. `.gitignore` excludes `data/`, `storage/` and backup files.
