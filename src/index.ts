import { app, logger } from '@/server';
import { ENV } from './environments/environment';
import { postgres } from './lib/prisma.lib';
import { redis } from './lib/redis.lib';

const server = app.listen(ENV.SERVER_PORT, async () => {
  await postgres.$connect();
  await redis.connect();
  const { NODE_ENV, SERVER_PORT: PORT } = ENV;
  logger.info(`Running mode: (${NODE_ENV}) on port ${PORT}`);
});

const onCloseSignal = () => {
  logger.info('sigint received, shutting down');
  server.close(() => {
    logger.info('server closed');
    process.exit();
  });
  setTimeout(() => process.exit(1), 5000).unref(); // Force shutdown after 5s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
process.on('exit', (code) => {
  logger.warn(`Application shutdown with code ${code}.`);
});
