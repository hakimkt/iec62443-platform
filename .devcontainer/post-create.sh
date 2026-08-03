#!/usr/bin/env bash
set -euo pipefail

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile || pnpm install

echo "=== Copying environment config ==="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "=== Generating Drizzle migrations ==="
pnpm db:generate || true

echo "=== Waiting for PostgreSQL ==="
MAX_WAIT=60
WAITED=0
until pg_isready -h postgres -U iec62443 -d iec62443_platform -q 2>/dev/null; do
  WAITED=$((WAITED + 2))
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "ERROR: PostgreSQL not ready after ${MAX_WAIT}s — aborting"
    exit 1
  fi
  echo "  PostgreSQL not ready yet... (${WAITED}s)"
  sleep 2
done
echo "  PostgreSQL is ready"

echo "=== Running database migrations ==="
pnpm db:migrate || echo "WARNING: Migration failed (may already be applied)"

echo "=== Seeding database ==="
pnpm db:seed || true
pnpm db:seed:demo-oil-gas || true
pnpm db:seed:demo-oil-gas-ot || true
pnpm db:seed:demo-oil-gas-assessment || true
pnpm db:seed:demo-oil-gas-governance || true
pnpm db:seed:demo-oil-gas-purdue || true

echo "=== Starting development servers ==="
nohup pnpm dev > /tmp/dev-servers.log 2>&1 &
echo "Dev servers starting in background (PID: $!)"
echo "  API:  http://localhost:4000"
echo "  Web:  http://localhost:3000"
echo "  Logs: tail -f /tmp/dev-servers.log"

echo ""
echo "=== Setup complete ==="
echo "Login credentials:"
echo "  Email:    admin@demo-corp.com"
echo "  Password: Demo1234!"
