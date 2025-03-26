import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { handleError } from '@/utils/handle-error.util';
import { handleResponse } from '@/utils/handle-response.util';
import { logger } from '../logger';
import { CONFIG } from '@/config/config';
import { ResponseData } from '../shared/models/response-data.model';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../user/user.service';
import { TAuthRequest } from './auth.model';

export class AuthController {
  private _cookieOptions: CookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };
  private _cookieMaxAge = CONFIG.refresh_token.expired_days * 24 * 60 * 60 * 1000;
  constructor(private authService = new AuthService(), private userService = new UserService()) {}

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
        console.log('REFRESH ACCESS TOKEN!');
        return handleResponse(responseData, res);
      }

      // Nếu Refresh Token không hợp lệ -> Xóa cookie & trả lỗi
      this._clearRefreshTokenFromCookie(res);
      return handleResponse(ResponseData.fail(responseData.message ?? 'Invalid refresh token!', StatusCodes.FORBIDDEN), res);
    } catch (error: any) {
      handleError(error, res);
    }
  }

  // async refreshRefreshToken(req: Request, res: Response) {
  //   try {
  //     const refreshToken = this._getRefreshTokenFromCookie(req);
  //     console.log('req.cookies', req.cookies);

  //     if (!refreshToken) {
  //       return handleResponse(ResponseData.fail('Refresh token is required!', StatusCodes.UNAUTHORIZED), res);
  //     }

  //     const responseData = await this.authService.refreshRefreshToken(refreshToken);
  //     if (responseData.success && responseData.data) {
  //       const { access_token, refresh_token, user } = responseData.data;
  //       this._clearRefreshTokenFromCookie(res);
  //       this._setRefreshTokenToCookie(res, refresh_token);
  //       handleResponse({ ...responseData, data: { access_token, user } }, res);
  //     } else {
  //       handleError(responseData.message ?? 'Error refresh token!', res);
  //     }
  //   } catch (error: any) {
  //     handleError(error, res);
  //   }
  // }

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
        if (resData.data?.refresh_token) {
          this._setRefreshTokenToCookie(res, resData.data?.refresh_token);
        }
      }
      const { refresh_token, ...data } = resData.data ?? {};
      handleResponse({ ...resData, data }, res);
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

  async verifyUser(req: TAuthRequest, res: Response) {
    try {
      const { id } = req.user ?? {};

      if (!id) {
        return handleResponse(ResponseData.fail('User id is not found!', StatusCodes.NOT_FOUND), res);
      }

      const response = await this.userService.getUserById(id);
      if (response.data && response.success) {
        return handleResponse(response, res);
      }

      return handleResponse(ResponseData.fail('User is not found!', StatusCodes.NOT_FOUND), res);
    } catch (error: any) {
      handleError(error, res);
    }
  }
}

export const authController = new AuthController();
