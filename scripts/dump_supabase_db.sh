#!/usr/bin/env bash
set -euo pipefail

# Simple, safe supabase dump script using pg_dump.
# Usage:
#   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" \
#     ./scripts/dump_supabase_db.sh
# Optional env vars:
#   BACKUP_DIR - directory to store backup files (default: backups)
#   OUTFILE - specific output file path
#   FORMAT - pg_dump format: custom|plain|directory|tar (default: custom)

BACKUP_DIR="${BACKUP_DIR:-backups}"
FORMAT="${FORMAT:-custom}"
OUTFILE="${OUTFILE:-$BACKUP_DIR/supabase-$(date +%Y%m%dT%H%M%S).dump}"
DATABASE_URL="${DATABASE_URL:-}"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required. Example:"
  echo "  DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require $0"
  exit 1
fi

command -v pg_dump >/dev/null 2>&1 || {
  echo "pg_dump not found. Install postgresql-client (Debian/Ubuntu):" >&2
  echo "  sudo apt update && sudo apt install -y postgresql-client" >&2
  exit 2
}

mkdir -p "$BACKUP_DIR"

case "$FORMAT" in
  custom|c)
    pg_dump --format=custom --file="$OUTFILE" "$DATABASE_URL"
    ;;
  plain|p)
    pg_dump --format=plain --no-owner --no-acl --file="$OUTFILE" "$DATABASE_URL"
    ;;
  directory|d)
    pg_dump --format=directory --file="$OUTFILE" "$DATABASE_URL"
    ;;
  tar|t)
    pg_dump --format=tar --file="$OUTFILE" "$DATABASE_URL"
    ;;
  *)
    echo "Unknown FORMAT: $FORMAT" >&2
    exit 3
    ;;
esac

echo "Dump successful: $OUTFILE"
