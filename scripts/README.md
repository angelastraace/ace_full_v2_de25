# Database Dump Script

This folder contains a small script to dump a Postgres database (useful for Supabase projects) via `pg_dump`.

Usage:

```bash
# Export a Database URL from Supabase (Project Settings -> Database)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Run a custom-format dump
DATABASE_URL="$DATABASE_URL" ./scripts/dump_supabase_db.sh

# Or specify output and format
BACKUP_DIR=backups FORMAT=plain OUTFILE=backups/db.sql DATABASE_URL="$DATABASE_URL" ./scripts/dump_supabase_db.sh
```

Notes:
- The script expects `pg_dump` to be installed. On Debian/Ubuntu, install `postgresql-client`.
- Do not commit credentials or dumps to Git. The `backups/` folder is added to `.gitignore`.
- For Supabase you may also use the Supabase CLI or Web UI exports. If you prefer the CLI, see:
  https://github.com/supabase/cli#install-the-cli
