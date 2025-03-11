import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import bodyParser from 'body-parser';
import router from './router';
const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
// app.set('trust proxy', true);

// Middlewares
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use('/api', router);
// Request logging
app.use((req, res, next) => {
  logger.info(`${req.hostname} sent a ${req.method} request to ${req.url}`);
  next();
});

// Routes
// app.use('/auth', authRouter);

// Error handlers
// app.use(errorHandler());

export { app, logger };
