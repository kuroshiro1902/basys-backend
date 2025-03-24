import { DB } from '@/database/database';

export class UserRepository {
  findMany = DB.user.findMany.bind(DB.user);
  findOne = DB.user.findFirst.bind(DB.user);
  create = DB.user.create.bind(DB.user);
  update = DB.user.update.bind(DB.user);

  $transaction = DB.$transaction.bind(DB);
}
