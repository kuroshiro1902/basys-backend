import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from './auth.service';
import { TAuthRequest } from './auth.model';
import { EPermission } from '../permission/permission.const';
import { BaseMiddleware } from '@/base/middlewares';
import { ResponseData } from '@/base/service';

export class AuthMiddleware extends BaseMiddleware {
  constructor(private authService: AuthService = new AuthService()) {
    super();
  }
  decodeAccessToken(req: TAuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1]?.trim();
      const response = this.authService.verifyAccessToken(token);
      if (response.success && typeof response.data === 'object' && response.data?.id) {
        req.user = response.data;
        next();
      } else {
        this.handleResponse(response, res);
      }
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  checkPermission(options: {
    some?: EPermission[];
    every?: EPermission[];
    someNot?: EPermission[];
    everyNot?: EPermission[];
  }) {
    return (req: TAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'Unauthorized',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
          res,
        );
      }

      const userPermissions = req.user.permissions ?? [];

      // Kiểm tra "some" (cần ít nhất 1 quyền thỏa mãn)
      if (options.some && !options.some.some((p) => userPermissions.includes(p))) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'Unauthorized',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
          res,
        );
      }

      // Kiểm tra "every" (cần tất cả quyền thỏa mãn)
      if (options.every && !options.every.every((p) => userPermissions.includes(p))) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'Unauthorized',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
          res,
        );
      }

      // Kiểm tra "someNot" (không được có 1 trong các quyền này)
      if (options.someNot && options.someNot.some((p) => userPermissions.includes(p))) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'Unauthorized',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
          res,
        );
      }

      // Kiểm tra "everyNot" (không được có tất cả các quyền này)
      if (options.everyNot && options.everyNot.some((p) => userPermissions.includes(p))) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'Unauthorized',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
          res,
        );
      }

      next();
    };
  }
}

export const authMiddleware = new AuthMiddleware();
