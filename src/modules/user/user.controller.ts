import { BaseController } from '@/base/controller';
import { userService as userServiceInstance } from './user.service';
import { Request, Response } from 'express';
import { TPageData, ZPageInput } from '../shared/models/paging.model';
import { TUser, UserDefaultSelect } from './user.model';
// import { permissionService as permissionServiceInstance } from '../permission/permission.service';
export class UserController extends BaseController {
  constructor(
    private userService = userServiceInstance, // private permissionService = permissionServiceInstance,
  ) {
    super();
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { pageIndex, pageSize, skip } = ZPageInput(20).parse({
        pageIndex: Number(req.query.pageIndex),
      });
      const users = await this.userService.base.findMany({
        skip,
        take: pageSize,
        select: {
          ...UserDefaultSelect,
          created_at: true,
          updated_at: true,
          permissions: {
            where: {
              permission: { active: true },
            },
            select: {
              permission_id: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const totalCount = await this.userService.base.count();
      const totalPage = Math.ceil(totalCount / pageSize);
      const hasNextPage = skip + users.length < totalCount;

      const pageData = {
        data: users.map((user) => ({
          ...user,
          permissions: user.permissions.map((permission) => permission.permission_id),
        })),
        pageInfo: { pageIndex, pageSize, totalPage, hasNextPage },
      };

      this.handleResponse({ success: true, data: pageData }, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}

export const userController = new UserController();
