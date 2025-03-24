import { DB } from './database/database';
import { logger } from './server';

// DB.feature.createMany({ data: [{ id: 'dashboard', name: 'Tổng quan' }] }).then((c) => {
//   logger.warn(`${c} refresh tokens`);
// });

// // DB.refreshToken.deleteMany({ where: {} }).then(({ count }) => {
// //   logger.warn(`Deleted ${count} refresh tokens`);
// // });

// DB.userFeature.create({ data: { feature_id: 'dashboard', user_id: 6 } });

DB.feature.update({ data: { id: 'super_admin', name: 'Siêu quản trị', active: true }, where: { id: 'dashboard' } }).then((c) => {
  logger.warn(c);
});
