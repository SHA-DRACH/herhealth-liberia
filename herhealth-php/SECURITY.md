# Security policy

## Reporting a vulnerability

Report security or privacy issues privately to SkillBridge Liberia Corporation instead of opening a public issue. Include steps to reproduce and the impact.

## Controls (section 31 checklist)

| Control | Implementation |
| --- | --- |
| HTTPS | Required for pilot/production; HSTS sent over HTTPS; admin cookie `Secure` on HTTPS |
| Secure admin authentication | Sessions with strict mode, regenerated on sign-in, 2-hour idle timeout; forced password change at first sign-in |
| Strong password hashing | `password_hash()` (bcrypt, automatic rehash); minimum 12 characters with letters and numbers |
| Brute-force protection | 10 sign-in attempts per 15 minutes per client; account lock for 15 minutes after 5 failures |
| Rate limiting | `/api/ask` 30 per 10 min, `/api/feedback` 20 per 10 min, `/api/event` 300 per 10 min |
| Input validation | Every admin field typed and validated server-side; public input length-limited and identifier-stripped |
| Parameterised queries | PDO prepared statements only, emulation off |
| CSRF | Token on every admin form; public JSON endpoints are same-origin only and hold no session |
| Output escaping / XSS | All output through `e()`; answers rendered with `textContent`; strict Content-Security-Policy (no inline scripts) |
| Uploads | Audio only (MIME checked with `finfo`), max 8 MB, random file names; scripts blocked in `uploads/` |
| Secrets | `.env` only (git-ignored); `APP_SECRET` mandatory in pilot/production; `scripts/secret_scan.php` |
| Roles | ADMIN, CONTENT_EDITOR, CLINICAL_REVIEWER, LANGUAGE_REVIEWER, FACILITY_VERIFIER, ANALYST |
| Audit logs | Every create/update/delete, approval, export, sign-in and setting change |
| Database permissions | Production app user: `SELECT, INSERT, UPDATE, DELETE` only on the HerHealth schema |
| Backups | `scripts/backup.sh` — AES-256 encrypted, ~30-day rotation |
| Production/debug separation | `APP_ENV` + `APP_DEBUG` (debug output only in development) |
| Dependency review | No third-party PHP packages; one vendored front-end library (AOS 2.3.4, MIT) |
