import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { handleError } from '@/utils/handle-error.util';
import { handleResponse } from '@/utils/handle-response.util';
import { logger } from '../logger';

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}
  async signup(req: Request, res: Response) {
    try {
      logger.info(req.body);

      const { body } = req;
      const data = await this.authService.signUp(body);
      handleResponse(data, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }
  async login(req: Request, res: Response) {
    try {
      logger.info(req.body);

      const { body } = req;
      const data = await this.authService.logIn(body);
      handleResponse(data, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }
}

export const authController = new AuthController();
