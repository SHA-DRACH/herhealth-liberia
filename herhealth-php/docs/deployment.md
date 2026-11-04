# Deployment

1. PHP 8.0+ with `pdo_mysql`, `mbstring`, `fileinfo`, `curl`; MySQL 5.7+ / MariaDB 10.3+; HTTPS certificate.
2. Point the web server's document root at `public/` (Apache `.htaccess` included; for nginx route all non-file requests to `index.php`).
3. Create the database and two users: a migration user (all privileges, used only to run `database/seed.php`) and the app user:
   ```sql
   CREATE USER 'herhealth'@'localhost' IDENTIFIED BY '…';
   GRANT SELECT, INSERT, UPDATE, DELETE ON herhealth.* TO 'herhealth'@'localhost';
   ```
4. `cp .env.example .env`; set `APP_ENV` (`testing` for structured testing, `pilot` for the pilot), `APP_SECRET` (64 hex chars), DB settings, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`. Keep `APP_DEBUG=0`.
5. `php database/seed.php` (with the migration user), then switch `.env` to the app user.
6. Make `public/uploads/audio/` and `storage/` writable by the web server only.
7. Cron: `php scripts/retention_cleanup.php` daily; `BACKUP_PASSPHRASE=… sh scripts/backup.sh` daily (store the passphrase outside the server).
8. Sign in at `/admin`, change the password, create team accounts with the right roles, set `live_site_url`, confirm the retention schedule, and verify facilities.
9. Run `php scripts/run_safety_suite.php`, `BASE_URL=https://… php tests/run_tests.php` and `php scripts/secret_scan.php`.

## Local development on this PC

XAMPP's MariaDB is started on port 3307 (so it does not clash with the MySQL 8 service on 3306):

```bash
C:/xampp/mysql/bin/mysqld.exe --defaults-file=C:/xampp/mysql/bin/my.ini --port=3307
C:/xampp/php/php.exe -S 127.0.0.1:8080 -t public public/index.php
```
