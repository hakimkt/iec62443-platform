import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { pino } from 'pino';

import { authPlugin } from './modules/auth/index.js';
import { assessmentPlugin } from './modules/assessment/index.js';
import { findingPlugin } from './modules/finding/index.js';
import { assetPlugin } from './modules/asset/index.js';
import { evidencePlugin } from './modules/evidence/index.js';
import { riskPlugin } from './modules/risk/index.js';
import { zonePlugin } from './modules/zone/index.js';
import { purduePlugin } from './modules/purdue/index.js';
import { dashboardPlugin } from './modules/dashboard/index.js';
import { reportPlugin } from './modules/report/index.js';
import { remediationPlugin } from './modules/remediation/index.js';
import { csmsPlugin } from './modules/csms/index.js';
import { adminPlugin } from './modules/admin/index.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: process.env['NODE_ENV'] === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const app = Fastify({
  logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  genReqId: () => crypto.randomUUID(),
});

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
});

await app.register(cors, {
  origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
});

await app.register(rateLimit, {
  max: 600,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip ?? 'unknown',
  errorResponseBuilder: () => ({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
    meta: { requestId: '', timestamp: new Date().toISOString() },
  }),
});

await app.register(swagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'IEC 62443 Platform API',
      description: 'Industrial Cybersecurity Management Platform API',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:4000/api/v1', description: 'Development' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & Identity' },
      { name: 'Tenants', description: 'Tenant Management' },
      { name: 'Assessments', description: 'Assessment Management' },
      { name: 'Findings', description: 'Finding Management' },
      { name: 'Risks', description: 'Risk Management' },
      { name: 'Zones', description: 'Zone & Conduit Management' },
      { name: 'Purdue', description: 'Purdue Model' },
      { name: 'CSMS', description: 'CSMS Management' },
      { name: 'Evidence', description: 'Evidence Repository' },
      { name: 'Remediation', description: 'Remediation Tracking' },
      { name: 'Assets', description: 'Asset Inventory' },
      { name: 'Reports', description: 'Report Generation' },
      { name: 'Dashboard', description: 'Dashboard Data' },
      { name: 'Admin', description: 'Administration' },
    ],
  },
});

await app.register(swaggerUi, {
  routePrefix: '/api/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// ── Auth Module ────────────────────────────────────────────────────────
await app.register(authPlugin, {
  connectionString: process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/iec62443',
  jwtConfig: {
    secret: process.env['JWT_SECRET'] ?? 'change-me-in-production',
    accessTokenTtl: process.env['JWT_ACCESS_TOKEN_TTL'] ?? '15m',
    refreshTokenTtl: process.env['JWT_REFRESH_TOKEN_TTL'] ?? '7d',
    issuer: process.env['JWT_ISSUER'] ?? 'iec62443-platform',
    audience: process.env['JWT_AUDIENCE'] ?? 'iec62443-platform-users',
  },
  mfaIssuer: process.env['MFA_ISSUER'] ?? 'IEC62443-Platform',
});

// ── Assessment Module ──────────────────────────────────────────────────
await app.register(assessmentPlugin);

// ── Finding Module ─────────────────────────────────────────────────────
await app.register(findingPlugin);

// ── Asset Module ──────────────────────────────────────────────────────
await app.register(assetPlugin);

// ── Evidence Module ───────────────────────────────────────────────────
await app.register(evidencePlugin);

// ── Risk Module ───────────────────────────────────────────────────────
await app.register(riskPlugin);

// ── Zone Module ───────────────────────────────────────────────────────
await app.register(zonePlugin);

// ── Purdue Module ─────────────────────────────────────────────────────
await app.register(purduePlugin);

// ── Dashboard Module ──────────────────────────────────────────────────
await app.register(dashboardPlugin);

// ── Report Module ─────────────────────────────────────────────────────
await app.register(reportPlugin);

// ── Remediation Module ────────────────────────────────────────────────
await app.register(remediationPlugin);

// ── CSMS Module ───────────────────────────────────────────────────────
await app.register(csmsPlugin);

// ── Admin Module ──────────────────────────────────────────────────────
await app.register(adminPlugin);

// ── Health Check ───────────────────────────────────────────────────────
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.setNotFoundHandler(async (_request, reply) => {
  return reply.status(404).send({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
    meta: { requestId: '', timestamp: new Date().toISOString() },
  });
});

app.setErrorHandler(async (error: Error & { statusCode?: number; code?: string }, _request, reply) => {
  const statusCode = error.statusCode ?? 500;
  const code = statusCode === 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR';

  if (statusCode >= 500) {
    app.log.error(error);
  } else {
    app.log.warn(error);
  }

  return reply.status(statusCode).send({
    error: {
      code,
      message: statusCode >= 500 ? 'An unexpected error occurred.' : (error.message ?? 'An error occurred'),
    },
    meta: { requestId: '', timestamp: new Date().toISOString() },
  });
});

const port = parseInt(process.env['API_PORT'] ?? '4000', 10);
const host = process.env['API_HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  app.log.info(`IEC 62443 Platform API running on http://${host}:${port}`);
  app.log.info(`API Documentation: http://${host}:${port}/api/docs`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
