import { DB } from './database/database';
import { logger } from './server';

DB.refreshToken.findMany({ where: {} }).then((c) => {
  logger.warn(`${c.length} refresh tokens`);
});

// DB.refreshToken.deleteMany({ where: {} }).then(({ count }) => {
//   logger.warn(`Deleted ${count} refresh tokens`);
// });
