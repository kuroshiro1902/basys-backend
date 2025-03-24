import { DB } from '@/database/database';

export class PermissionRepository {
  findMany = DB.permission.findMany.bind(DB.permission);
  findOne = DB.permission.findFirst.bind(DB.permission);
  create = DB.permission.create.bind(DB.permission);
  update = DB.permission.update.bind(DB.permission);
  count = DB.permission.count.bind(DB.permission);

  $transaction = DB.$transaction.bind(DB);
}
