import { CookieOptions, Request, Response } from 'express';
import { authService as authServiceInstance } from './auth.service';
import { logger } from '../logger';
import { CONFIG } from '@/config/config';
import { ResponseData } from '@/base/service';
import { StatusCodes } from 'http-status-codes';
import { userService as userServiceInstance } from '../user/user.service';
import { TAuthRequest, TRefreshToken, ZRefreshToken } from './auth.model';
import { BaseController } from '@/base/controller';
import { UserDefaultSelect, ZUserCreateInput } from '../user/user.model';
import { z } from 'zod';

export class AuthController extends BaseController {
  private _cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };
  private _cookieMaxAgeMs = CONFIG.refresh_token.expired_days * 24 * 60 * 60 * 1000;
  constructor(
    private authService = authServiceInstance,
    private userService = userServiceInstance,
  ) {
    super();
  }

  private getRefreshTokenFromCookie = (req: Request) =>
    req.cookies?.[CONFIG.refresh_token.cookie_key] as TRefreshToken | undefined;
  private clearRefreshTokenFromCookie = (res: Response) =>
    res.clearCookie(CONFIG.refresh_token.cookie_key, this._cookieOptions);
  private setRefreshTokenToCookie = (res: Response, refreshToken: TRefreshToken) => {
    res.cookie(CONFIG.refresh_token.cookie_key, refreshToken, {
      ...this._cookieOptions,
      maxAge: this._cookieMaxAgeMs,
    });
  };

  async refreshAccessToken(req: Request, res: Response) {
    const { data: refreshToken } = ZRefreshToken.safeParse(
      this.getRefreshTokenFromCookie(req),
    );

    if (!refreshToken) {
      return this.handleResponse(
        ResponseData.fail({
          message: 'Refresh token is required!',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
        res,
      );
    }

    // Xác thực Refresh Token & tạo Access Token mới
    const responseData = await this.authService.refreshAccessToken(refreshToken);
    if (responseData.success) {
      console.log('REFRESH ACCESS TOKEN!');
      return this.handleResponse(responseData, res);
    }

    // Nếu Refresh Token không hợp lệ -> Xóa cookie & trả lỗi
    this.clearRefreshTokenFromCookie(res);
    return this.handleResponse(
      ResponseData.fail({
        message: responseData.message ?? 'Invalid refresh token!',
        statusCode: StatusCodes.FORBIDDEN,
      }),
      res,
    );
  }

  async signup(req: Request, res: Response) {
    try {
      const { confirmPassword, ...credentials } = ZUserCreateInput.extend({
        confirmPassword: ZUserCreateInput.shape.password,
      })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Mật khẩu không khớp',
          path: ['confirmPassword'],
        })
        .parse(req.body);
      const resData = await this.authService.signUp(credentials);
      this.handleResponse(resData, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  async login(req: Request, res: Response) {
    try {
      logger.info(req.body);
      const { email, password } = req.body;
      const refreshFromCookie = this.getRefreshTokenFromCookie(req);
      const resData = await this.authService.logIn({
        email,
        password,
        refresh_token: refreshFromCookie,
      });
      if (resData.success) {
        if (refreshFromCookie) {
          this.clearRefreshTokenFromCookie(res);
        }
        if (resData.data?.refresh_token) {
          this.setRefreshTokenToCookie(res, resData.data.refresh_token);
        }
        const { refresh_token, ...data } = resData.data ?? {};
        this.handleResponse({ ...resData, data }, res);
        return;
      }
      this.handleResponse({ ...resData }, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = this.getRefreshTokenFromCookie(req);
      if (refreshToken) {
        this.clearRefreshTokenFromCookie(res);
      }
      const responseData = await this.authService.logOut(refreshToken!);
      this.handleResponse(responseData, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async me(req: TAuthRequest, res: Response) {
    try {
      const { id } = req.user ?? {};

      if (!id) {
        return this.handleResponse(
          ResponseData.fail({
            message: 'User id is not found!',
            statusCode: StatusCodes.NOT_FOUND,
          }),
          res,
        );
      }

      const resData = await this.authService.me(id);
      return this.handleResponse(resData, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}

export const authController = new AuthController();
