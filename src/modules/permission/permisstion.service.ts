import { DB } from '@/database/database';
import { ResponseData } from '../shared/models/response-data.model';
import { Prisma } from '@prisma/client';

export class PermissionService {
  base = DB.permission;
  constructor() {}

  public async getActivePermissionsByUserId(
    user_id: number,
    args: Prisma.PermissionFindManyArgs = {},
  ) {
    const data = await this.base.findMany({
      ...args,
      where: {
        ...args.where,
        active: true,
        users: {
          some: { user_id },
        },
      },
    });
    return ResponseData.success({ data });
  }
}
