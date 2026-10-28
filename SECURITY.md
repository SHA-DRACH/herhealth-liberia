# Security policy

## Reporting a vulnerability

Please report security or privacy issues privately to SkillBridge Liberia Corporation rather than opening a public issue. Include steps to reproduce and the impact. We aim to acknowledge reports within 5 working days.

## Controls in this codebase

- HTTPS only in production (terminate TLS at the proxy; cookies are `Secure` when `NODE_ENV=production`).
- scrypt password hashing; login lockout after 5 failed attempts for 15 minutes.
- Hashed, expiring admin session tokens; `HttpOnly`, `SameSite=Strict` cookies.
- Least-privilege roles (`src/lib/admin/auth.ts`): medical and language approval cannot be performed by the author/translator or by a Super Admin.
- CSRF: server actions enforce same-origin; admin JSON routes check `Origin`.
- Input validation on every route; parameterised SQL only.
- Rate limiting on `/api/ask`, `/api/events`, `/api/feedback`, `/api/session`, admin login.
- Strict security headers and Content-Security-Policy (`next.config.ts`).
- Admin audit log for every mutation.
- Prompt-injection controls: retrieved content and the question are delimited and treated as data, structured output is schema-validated, and every generated answer passes a post-generation check or is replaced by approved text.
- Secrets only via environment variables; `APP_SECRET` is required in production.

## Operator checklist

- Use a restricted database user (no superuser) for the application.
- Enable regular encrypted backups and test restores.
- Run `npm audit` and keep dependencies updated (CI runs the audit).
- Keep production and debug separate: never run `next dev` in production.
