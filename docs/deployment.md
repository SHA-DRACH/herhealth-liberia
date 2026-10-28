# Deployment

Target: `herhealth.skillbridgeliberia.com` on SkillBridge-controlled infrastructure.

1. Provision PostgreSQL 15+ with the `pgvector` extension and a restricted application user (owner of its own schema only).
2. Set environment variables (see `.env.example`): `DATABASE_URL`, `APP_SECRET` (32+ random bytes), `AI_PROVIDER`, `ANTHROPIC_API_KEY` if used, optional `NEXT_PUBLIC_PRIVACY_CONTACT`, `AUDIO_STORAGE_DIR` (persistent volume).
3. Build and start:
   ```bash
   npm ci
   npm run build
   npm run admin:create -- --name "…" --email … --role SUPER_ADMIN
   npm start
   ```
4. Put a TLS-terminating reverse proxy (e.g. Nginx/Caddy) in front; forward `X-Forwarded-For`; redirect HTTP to HTTPS.
5. Back up the database and the audio directory daily (encrypted); test a restore.
6. Run `npm run safety:run` after every content or lexicon change and before each release.

Never run `next dev` in production, and never point a development machine at the production database.
