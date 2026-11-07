#!/usr/bin/env bash
# Applies numbered SQL files in this folder that haven't run yet.
# Usage: DIRECT_URL=postgres://... ./db/apply.sh   (or export it / source backend/.env first)
set -euo pipefail

: "${DIRECT_URL:?set DIRECT_URL (direct connection, not the pooler)}"
dir="$(cd "$(dirname "$0")" && pwd)"

psql "$DIRECT_URL" -q -c "create table if not exists public._migrations (name text primary key, applied_at timestamptz default now());"

for f in "$dir"/[0-9][0-9][0-9]_*.sql; do
  n="$(basename "$f")"
  if [ -z "$(psql "$DIRECT_URL" -Atc "select 1 from public._migrations where name='$n'")" ]; then
    echo "applying $n"
    # -1 wraps the file in a single transaction
    psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -1 -f "$f"
    psql "$DIRECT_URL" -q -c "insert into public._migrations(name) values ('$n')"
  else
    echo "skipping $n (already applied)"
  fi
done
