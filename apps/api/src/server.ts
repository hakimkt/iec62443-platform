import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { sql } from 'drizzle-orm';
import Fastify from 'fastify';
import { adminPlugin } from './modules/admin/index.js';
import { assessmentPlugin } from './modules/assessment/index.js';
import { assetPlugin } from './modules/asset/index.js';
import { authPlugin } from './modules/auth/index.js';
import { csmsPlugin } from './modules/csms/index.js';
import { dashboardPlugin } from './modules/dashboard/index.js';
import { evidencePlugin } from './modules/evidence/index.js';
import { findingPlugin } from './modules/finding/index.js';
import { purduePlugin } from './modules/purdue/index.js';
import { remediationPlugin } from './modules/remediation/index.js';
import { reportPlugin } from './modules/report/index.js';
import { riskPlugin } from './modules/risk/index.js';
import { zonePlugin } from './modules/zone/index.js';

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport:
      process.env['NODE_ENV'] === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
  requestIdHeader: 'x-request-id',
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
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, mobile)
    if (!origin) return callback(null, true);

    const allowed = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    // Explicit CORS_ORIGIN env var (comma-separated)
    if (process.env['CORS_ORIGIN']) {
      for (const o of process.env['CORS_ORIGIN'].split(',')) {
        allowed.push(o.trim());
      }
    }

    // GitHub Codespaces — allow any *.app.github.dev origin
    if (origin.endsWith('.app.github.dev')) {
      return callback(null, true);
    }

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all origins as a fallback
    if (process.env['NODE_ENV'] === 'development') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id', 'Idempotency-Key'],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
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
    servers: [{ url: 'http://localhost:4000/api/v1', description: 'Development' }],
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

// ── Validate required environment variables ────────────────────────────
const insecureDefaults = ['change-me-in-production', 'dev-jwt-secret-change-in-production'];
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(
  (key) => !process.env[key] || insecureDefaults.includes(process.env[key]!),
);
if (missingEnvVars.length > 0 && process.env['NODE_ENV'] === 'production') {
  app.log.fatal(
    `Missing or insecure environment variables: ${missingEnvVars.join(', ')}. Refusing to start in production mode.`,
  );
  process.exit(1);
}

// ── All API routes under /api/v1 prefix ────────────────────────────────
await app.register(
  async (api) => {
    api.register(authPlugin, {
      connectionString:
        process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/iec62443',
      jwtConfig: {
        secret: process.env['JWT_SECRET'] ?? 'change-me-in-production',
        accessTokenTtl: process.env['JWT_ACCESS_TOKEN_TTL'] ?? '15m',
        refreshTokenTtl: process.env['JWT_REFRESH_TOKEN_TTL'] ?? '7d',
        issuer: process.env['JWT_ISSUER'] ?? 'iec62443-platform',
        audience: process.env['JWT_AUDIENCE'] ?? 'iec62443-platform-users',
      },
      mfaIssuer: process.env['MFA_ISSUER'] ?? 'IEC62443-Platform',
    });
    api.register(assessmentPlugin);
    api.register(findingPlugin);
    api.register(assetPlugin);
    api.register(evidencePlugin);
    api.register(riskPlugin);
    api.register(zonePlugin);
    api.register(purduePlugin);
    api.register(dashboardPlugin);
    api.register(reportPlugin);
    api.register(remediationPlugin);
    api.register(csmsPlugin);
    api.register(adminPlugin);
  },
  { prefix: '/api/v1' },
);

// ── Health Check ───────────────────────────────────────────────────────
app.get('/health', async () => {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check database connectivity
  try {
    await app.db.execute(sql`SELECT 1`);
    checks['database'] = 'ok';
  } catch {
    checks['database'] = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  return {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  };
});

app.get('/ready', async (_request, reply) => {
  try {
    await app.db.execute(sql`SELECT 1`);
    return { status: 'ready', timestamp: new Date().toISOString() };
  } catch {
    return reply.status(503).send({ status: 'not_ready', timestamp: new Date().toISOString() });
  }
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

app.setErrorHandler(
  async (error: Error & { statusCode?: number; code?: string }, _request, reply) => {
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
        message:
          statusCode >= 500
            ? 'An unexpected error occurred.'
            : (error.message ?? 'An error occurred'),
      },
      meta: { requestId: '', timestamp: new Date().toISOString() },
    });
  },
);

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

// ── Graceful Shutdown ──────────────────────────────────────────────────
const SHUTDOWN_TIMEOUT_MS = 30_000;

async function gracefulShutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  const timeout = setTimeout(() => {
    app.log.warn('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  try {
    await app.close();
    clearTimeout(timeout);
    app.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    app.log.error(err, 'Error during shutdown');
    clearTimeout(timeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
