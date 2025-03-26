import { handleResponse } from '@/utils/handle-response.util';
import { NextFunction, Request, Response } from 'express';
import { ResponseData } from '../shared/models/response-data.model';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from './auth.service';
import { handleError } from '@/utils/handle-error.util';
import { TAuthRequest } from './auth.model';
import { EPermission } from '../permission/permission.const';

export class AuthMiddleware {
  constructor(private authService: AuthService = new AuthService()) {}
  decodeAccessToken() {
    return (req: TAuthRequest, res: Response, next: NextFunction) => {
      try {
        const token = req.headers.authorization?.split(' ')[1]?.trim();
        const response = this.authService.verifyAccessToken(token);
        if (response.success && typeof response.data === 'object' && response.data?.id) {
          req.user = response.data;
          next();
        } else {
          handleResponse(response, res);
        }
      } catch (error: any) {
        handleError(error, res);
      }
    };
  }

  checkPermission(options: { some?: EPermission[]; every?: EPermission[]; someNot?: EPermission[]; everyNot?: EPermission[] }) {
    return (req: TAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return handleResponse(ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED), res);
      }

      const userPermissions = req.user.permissions ?? [];

      // Kiểm tra "some" (cần ít nhất 1 quyền thỏa mãn)
      if (options.some && !options.some.some((p) => userPermissions.includes(p))) {
        return handleResponse(ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED), res);
      }

      // Kiểm tra "every" (cần tất cả quyền thỏa mãn)
      if (options.every && !options.every.every((p) => userPermissions.includes(p))) {
        return handleResponse(ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED), res);
      }

      // Kiểm tra "someNot" (không được có 1 trong các quyền này)
      if (options.someNot && options.someNot.some((p) => userPermissions.includes(p))) {
        return handleResponse(ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED), res);
      }

      // Kiểm tra "everyNot" (không được có tất cả các quyền này)
      if (options.everyNot && options.everyNot.some((p) => userPermissions.includes(p))) {
        return handleResponse(ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED), res);
      }

      next();
    };
  }
}

// async getUserPermissions(user_id: number, permission_ids?: string[]) {
//   if(!permission_ids) {
//     const user = await this.userRepository.findOne({ where: { id: user_id } });
//   }
//   else {

//   }
//   const user = await this.userRepository.findOne({
//     where: { id: user_id, permissions: { every: { permission_id: { in: permission_ids } } } },
//   });
// }
