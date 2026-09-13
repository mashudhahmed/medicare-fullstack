#!/bin/bash
set -euo pipefail

echo "[entrypoint] Waiting for database..."
# Simple wait loop – replace with wait-for-it or dockerize if preferred
python - <<'PY'
import os, time, sys
import dj_database_url
import psycopg2

url = os.environ.get("DATABASE_URL")
if not url:
    # Build from parts
    host = os.environ.get("DB_HOST", "db")
    port = os.environ.get("DB_PORT", "5432")
    name = os.environ.get("DB_NAME", "healthcare_db")
    user = os.environ.get("DB_USER", "postgres")
    password = os.environ.get("DB_PASSWORD", "")
    url = f"postgres://{user}:{password}@{host}:{port}/{name}"

cfg = dj_database_url.parse(url)
for i in range(30):
    try:
        conn = psycopg2.connect(
            dbname=cfg.get("NAME"),
            user=cfg.get("USER"),
            password=cfg.get("PASSWORD"),
            host=cfg.get("HOST"),
            port=cfg.get("PORT") or 5432,
            connect_timeout=3,
        )
        conn.close()
        print("[entrypoint] Database is ready")
        sys.exit(0)
    except Exception as e:
        print(f"[entrypoint] DB not ready ({e}), retry {i+1}/30...")
        time.sleep(2)
print("[entrypoint] Database never became ready", file=sys.stderr)
sys.exit(1)
PY

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "[entrypoint] Starting: $*"
exec "$@"
