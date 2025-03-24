import { DB } from '@/database/database';
import { Feature, Prisma, PrismaClient, RefreshToken, User } from '@prisma/client';
import { TFeaturePermission } from '../feature-permission/feature-permission.model';
import { REFRESH_TOKEN_EXPIRED_TIMESTAMP } from '../auth/auth.const';
import { CONFIG } from '@/config/config';

export class UserRepository {
  findMany = DB.user.findMany.bind(DB.user);
  findOne = DB.user.findFirst.bind(DB.user);
  create = DB.user.create.bind(DB.user);
  update = DB.user.update.bind(DB.user);

  $transaction = DB.$transaction.bind(DB);
}
