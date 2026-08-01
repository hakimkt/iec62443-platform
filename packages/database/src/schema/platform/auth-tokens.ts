import {
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

// ── Auth Tokens ──────────────────────────────────────────────────────────
// Persists password reset tokens, MFA challenges, and JWT revocation
// entries. Replaces the in-memory Map stores that were lost on restart.

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenType: varchar('token_type', { length: 30 }).notNull(),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'auth_tokens_type_check',
      sql`token_type IN ('password_reset', 'mfa_challenge', 'jwt_revocation')`,
    ),
    index('idx_auth_tokens_hash').on(table.tokenHash, table.tokenType),
    index('idx_auth_tokens_expires').on(table.expiresAt),
    index('idx_auth_tokens_user').on(table.userId, table.tokenType),
  ],
);
