#!/usr/bin/env bash
# ==============================================================================
# CampusOS — Linux Automated PostgreSQL Backup Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/product/server/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/campusos_backup_${TIMESTAMP}.sql.gz"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Read DATABASE_URL from .env if present
ENV_FILE="$PROJECT_ROOT/product/server/.env"
DB_NAME="campusos"
DB_USER="campusos"
DB_HOST="127.0.0.1"
DB_PORT="5432"

if [ -f "$ENV_FILE" ]; then
    # Extract DATABASE_URL if available
    DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

echo "=========================================================="
echo "  CampusOS Database Backup Utility (Linux/Ubuntu)"
echo "=========================================================="
echo "Timestamp:   $TIMESTAMP"
echo "Destination: $BACKUP_FILE"

if [ -n "${DB_URL:-}" ]; then
    pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"
else
    PGPASSWORD="${PGPASSWORD:-campusos_secure_password}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup successfully created! ($BACKUP_SIZE)"

# Retain last 14 days of backups, purge older
echo "==> Cleaning up backups older than 14 days..."
find "$BACKUP_DIR" -name "campusos_backup_*.sql.gz" -mtime +14 -delete || true
echo "✅ Backup maintenance complete."
