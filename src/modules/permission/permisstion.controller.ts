import { Request, Response } from 'express';
import { handleResponse } from '@/utils/handle-response.util';
import { handleError } from '@/utils/handle-error.util';
import { PermissionService } from './permisstion.service';

export class PermissionController {
  constructor(private permissionService = new PermissionService()) {}
  async getUserPermissions(req: Request, res: Response) {
    try {
      const { user_id } = req.query;
      const data = await this.permissionService.getPermissionsByUserId(Number(user_id));
      handleResponse(data, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }
}
