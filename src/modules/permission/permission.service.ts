import { DB } from '@/database/database';
import { ResponseData } from '@/base/service';
import { Prisma } from '@/generated/prisma';

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

export const permissionService = new PermissionService();
