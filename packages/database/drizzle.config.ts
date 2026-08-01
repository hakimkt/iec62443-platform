import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/**/*.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://iec62443:iec62443_dev@localhost:5432/iec62443_platform',
  },
  verbose: true,
  strict: true,
});
