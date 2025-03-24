import { handleResponse } from '@/utils/handle-response.util';
import { NextFunction, Request, Response } from 'express';
import { ResponseData } from '../shared/models/response-data.model';
import { StatusCodes } from 'http-status-codes';
import { authService, AuthService } from './auth.service';
import { handleError } from '@/utils/handle-error.util';
import { TAuthRequest } from './auth.model';

export class AuthMiddleware {
  constructor(private authService: AuthService = new AuthService()) {}
  async checkAccessTokenValid(req: TAuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1]?.trim();
    try {
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
  }
}

export const authMiddleware = new AuthMiddleware(authService);
