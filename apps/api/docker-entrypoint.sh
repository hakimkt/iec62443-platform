#!/bin/sh
set -e

echo "Running database migrations..."
cd /app

# Run the seed script if the database is empty (no users table)
RESULT=$(node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => client.query('SELECT COUNT(*) FROM users')).then(r => {
  console.log(r.rows[0].count);
  client.end();
}).catch(e => {
  console.log('0');
  client.end();
});
" 2>/dev/null || echo "0")

if [ "$RESULT" = "0" ]; then
  echo "Database appears empty — seeding..."
  # The seed will be run from the host on first deploy
  echo "Run: pnpm --filter @iec62443/database exec -- tsx src/seed/index.ts"
fi

echo "Starting API server..."
exec node apps/api/dist/server.js
