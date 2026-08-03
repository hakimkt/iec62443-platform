import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

export interface TokenPayload extends JWTPayload {
  sub: string;
  tenant_id: string;
  tenant_slug: string;
  roles: string[];
  permissions: string[];
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtConfig {
  secret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  issuer: string;
  audience: string;
}

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Omit<TokenPayload, 'jti'>,
  config: JwtConfig,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(config.accessTokenTtl)
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setJti(crypto.randomUUID())
    .sign(getSecretKey(config.secret));
}

export async function signRefreshToken(
  userId: string,
  tenantId: string,
  config: JwtConfig,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: userId, tenant_id: tenantId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(config.refreshTokenTtl)
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setJti(crypto.randomUUID())
    .sign(getSecretKey(config.secret));
}

export async function verifyToken(token: string, config: JwtConfig): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(config.secret), {
    issuer: config.issuer,
    audience: config.audience,
  });
  return payload as TokenPayload;
}

export function isTokenExpired(payload: TokenPayload): boolean {
  if (!payload.exp) return true;
  return payload.exp < Math.floor(Date.now() / 1000);
}
