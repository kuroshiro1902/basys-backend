import dotenv from 'dotenv';
import { cleanEnv, host, num, port, str } from 'envalid';

dotenv.config();

export const ENV = cleanEnv(process.env, {
  NODE_ENV: str({ devDefault: 'development', choices: ['development', 'production'] }),

  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: 100 }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: 1000 }),

  SERVER_PORT: port({ devDefault: 3000 }),

  DATABASE_URL: str(),

  CLIENT_URL: str(),

  ACCESS_TOKEN_SECRET: str(),
  REFRESH_TOKEN_SECRET: str(),
});
