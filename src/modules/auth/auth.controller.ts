import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { handleError } from '@/utils/handle-error.util';
import { handleResponse } from '@/utils/handle-response.util';
import { logger } from '../logger';
import { CONFIG } from '@/config/config';
import { ResponseData } from '../shared/models/response-data.model';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  private _cookieOptions: CookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };
  private _cookieMaxAge = CONFIG.refresh_token.expired_days * 24 * 60 * 60 * 1000;
  constructor(private authService: AuthService = new AuthService()) {}

  private _getRefreshTokenFromCookie = (req: Request) => req.cookies?.[CONFIG.refresh_token.cookie_key] as string | undefined;
  private _clearRefreshTokenFromCookie = (res: Response) => res.clearCookie(CONFIG.refresh_token.cookie_key, this._cookieOptions);
  private _setRefreshTokenToCookie = (res: Response, refreshToken: string) => {
    res.cookie(CONFIG.refresh_token.cookie_key, refreshToken, {
      ...this._cookieOptions,
      maxAge: this._cookieMaxAge,
    });
  };

  async refreshAccessToken(req: Request, res: Response) {
    try {
      const refreshToken = this._getRefreshTokenFromCookie(req);

      if (!refreshToken) {
        return handleResponse(ResponseData.fail('Refresh token is required!', StatusCodes.UNAUTHORIZED), res);
      }

      // Xác thực Refresh Token & tạo Access Token mới
      const responseData = await this.authService.refreshAccessToken(refreshToken);

      if (responseData.success) {
        return handleResponse(responseData, res);
      }

      // Nếu Refresh Token không hợp lệ -> Xóa cookie & trả lỗi
      this._clearRefreshTokenFromCookie(res);
      return handleResponse(ResponseData.fail('Invalid or expired refresh token', StatusCodes.FORBIDDEN), res);
    } catch (error: any) {
      handleError(error, res);
    }
  }

  async refreshRefreshToken(req: Request, res: Response) {
    try {
      const refreshToken = this._getRefreshTokenFromCookie(req);
      console.log('req.cookies', req.cookies);

      if (!refreshToken) {
        return handleResponse(ResponseData.fail('Refresh token is required!', StatusCodes.UNAUTHORIZED), res);
      }

      this._clearRefreshTokenFromCookie(res);
      const responseData = await this.authService.refreshRefreshToken(refreshToken);
      if (responseData.success) {
        this._setRefreshTokenToCookie(res, refreshToken);
      }
      handleResponse(responseData, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }

  async signup(req: Request, res: Response) {
    try {
      const { body } = req;
      const data = await this.authService.signUp(body);
      handleResponse(data, res);
    } catch (error: any) {
      logger.error(error);
      handleError(error, res);
    }
  }
  async login(req: Request, res: Response) {
    try {
      logger.info(req.body);
      const { email, password } = req.body;
      const refreshFromCookie = this._getRefreshTokenFromCookie(req);
      const resData = await this.authService.logIn({ email, password, refresh_token: refreshFromCookie });
      if (resData.success) {
        if (refreshFromCookie) {
          this._clearRefreshTokenFromCookie(res);
        }
        if (resData.data?.refreshToken) {
          this._setRefreshTokenToCookie(res, resData.data?.refreshToken);
        }
      }
      handleResponse(resData, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }

  async logOut(req: Request, res: Response) {
    try {
      const refreshToken = this._getRefreshTokenFromCookie(req);
      if (refreshToken) {
        this._clearRefreshTokenFromCookie(res);
      }
      const responseData = await this.authService.logOut(refreshToken!);
      handleResponse(responseData, res);
    } catch (error: any) {
      handleError(error, res);
    }
  }
}

export const authController = new AuthController();
