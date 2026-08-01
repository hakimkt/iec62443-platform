-- Auth Tokens — replaces in-memory Map stores for password reset tokens,
-- MFA challenges, and JWT revocation. Ensures persistence across restarts.

CREATE TABLE IF NOT EXISTS auth_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_type      VARCHAR(30) NOT NULL
                    CHECK (token_type IN ('password_reset', 'mfa_challenge', 'jwt_revocation')),
    token_hash      VARCHAR(128) NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    expires_at      TIMESTAMPTZ NOT NULL,
    consumed_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash, token_type);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id, token_type);
