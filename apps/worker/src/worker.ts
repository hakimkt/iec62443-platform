import { Queue, Worker } from 'bullmq';
import { pino } from 'pino';
import { processReportGeneration, type ReportJobData } from './jobs/report-generation.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport:
    process.env['NODE_ENV'] === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
};

const reportQueue = new Queue('report-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
const importQueue = new Queue('bulk-import', { connection });
const emailQueue = new Queue('email-notification', { connection });
const riskRecalcQueue = new Queue('risk-recalculation', { connection });

const reportWorker = new Worker<ReportJobData>('report-generation', processReportGeneration, {
  connection,
  concurrency: 2,
});

const importWorker = new Worker(
  'bulk-import',
  async (job) => {
    logger.info({ jobId: job.id, type: job.data.type }, 'Processing bulk import job');
    return { status: 'completed', jobId: job.id };
  },
  { connection, concurrency: 1 },
);

const emailWorker = new Worker(
  'email-notification',
  async (job) => {
    logger.info({ jobId: job.id, type: job.data.type }, 'Processing email notification job');
    return { status: 'completed', jobId: job.id };
  },
  { connection, concurrency: 5 },
);

const riskRecalcWorker = new Worker(
  'risk-recalculation',
  async (job) => {
    logger.info({ jobId: job.id, type: job.data.type }, 'Processing risk recalculation job');
    return { status: 'completed', jobId: job.id };
  },
  { connection, concurrency: 1 },
);

[reportWorker, importWorker, emailWorker, riskRecalcWorker].forEach((worker) => {
  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Job completed');
  });
  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message, attemptsMade: job?.attemptsMade },
      'Job failed',
    );
  });
});

// Ensure queues are referenced to avoid unused variable warnings
void reportQueue;
void importQueue;
void emailQueue;
void riskRecalcQueue;

logger.info('IEC 62443 Platform Worker started');

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await Promise.all([
    reportWorker.close(),
    importWorker.close(),
    emailWorker.close(),
    riskRecalcWorker.close(),
  ]);
  process.exit(0);
});
