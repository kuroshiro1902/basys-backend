import { Request, Response } from 'express';
import { permissionService as permissionServiceInstance } from './permission.service';
import { BaseController } from '@/base/controller';
import { ZUser } from '../user/user.model';

export class PermissionController extends BaseController {
  constructor(private permissionService = permissionServiceInstance) {
    super();
  }

  async getUserActivePermissions(req: Request, res: Response) {
    try {
      const { user_id } = req.query;

      const validUserId = ZUser.shape.id.parse(user_id);
      const data = await this.permissionService.getActivePermissionsByUserId(validUserId);
      this.handleResponse(data, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
