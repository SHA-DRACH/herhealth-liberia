#!/usr/bin/env sh
# Encrypted rotating database backup (section 15/31). Keeps ~30 days.
# Usage (cron, daily):  BACKUP_PASSPHRASE=... sh scripts/backup.sh
# Requires mysqldump and openssl. Reads DB settings from .env.
set -eu
cd "$(dirname "$0")/.."
. ./.env 2>/dev/null || true
DIR=storage/backups
mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
: "${BACKUP_PASSPHRASE:?Set BACKUP_PASSPHRASE}"
mysqldump --single-transaction --no-tablespaces -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME:-herhealth}" \
  | gzip | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -out "$DIR/herhealth-$STAMP.sql.gz.enc"
find "$DIR" -name 'herhealth-*.sql.gz.enc' -mtime +30 -delete
echo "Backup written: $DIR/herhealth-$STAMP.sql.gz.enc"
