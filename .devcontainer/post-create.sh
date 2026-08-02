#!/usr/bin/env bash
set -euo pipefail

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Copying environment config ==="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example (Codespace overrides are set via docker-compose)"
fi

echo "=== Generating Drizzle migrations ==="
pnpm db:generate || true

echo "=== Waiting for PostgreSQL ==="
until pg_isready -h postgres -U iec62443 -d iec62443_platform -q 2>/dev/null; do
  echo "  PostgreSQL not ready yet..."
  sleep 2
done
echo "  PostgreSQL is ready"

echo "=== Running database migrations ==="
pnpm db:migrate

echo "=== Seeding database ==="
pnpm db:seed || true

echo "=== Setup complete ==="
echo "Run 'pnpm dev' to start the development servers."
