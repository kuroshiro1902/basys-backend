import 'reflect-metadata';
import { app, logger } from '@/server';
import { ENV } from './environments/environment';
import { Mongo } from './database/mongo.database';
import { Postgres } from './database/postgres.database';
import { elasticConnect } from './database/elastic.database';
import { etlService } from './modules/etl/etl.service';
import schedule, { RecurrenceRule } from 'node-schedule';
import { dashboardJob, etlJob } from './modules/jobs/etl.job';
import { jobs } from './modules/jobs';

const databasesConnect = async () => {
  return await Promise.all([Mongo.connect(), Postgres.connect(), elasticConnect()]).catch((err) => {
    logger.warn('Fail connect to databases: ' + JSON.stringify({ err }));
    process.exit(1);
  });
};

const server = app.listen(ENV.SERVER_PORT, async () => {
  await databasesConnect();
  await jobs();
  const { NODE_ENV, SERVER_HOST: HOST, SERVER_PORT: PORT } = ENV;
  logger.info(`Running mode: (${NODE_ENV}) on port http://${HOST}:${PORT}`);
});

const onCloseSignal = () => {
  logger.info('sigint received, shutting down');
  Mongo.disconnect();
  Postgres.disconnect();
  server.close(() => {
    logger.info('server closed');
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
process.on('exit', (code) => {
  logger.fatal(`Application shutdown with code ${code}.`);
});
