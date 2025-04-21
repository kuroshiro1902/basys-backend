import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ResponseData, TResponseData } from '@/modules/shared/models/response-data.model';
import { z } from 'zod';
import { ENV } from '@/environments/environment';
import bcrypt from 'bcrypt';
import {
  TUser,
  UserDefaultDTO,
  UserDefaultSelect,
  TUserCreateInput,
} from '../user/user.model';
import {
  ZRefreshToken,
  TRefreshToken,
  TUserJWTPayload,
  TAccessToken,
} from './auth.model';
import { logger } from '../logger';
import { CONFIG } from '@/config/config';
import { PermissionService } from '../permission/permisstion.service';
import { UserService } from '../user/user.service';
import { DB } from '@/database/database';

export class AuthService {
  private renewAccessTokenDirection = 'VALID_ACCESS_TOKEN_REQUIRED';

  constructor(
    private userService = new UserService(),
    private permissionService = new PermissionService(),
  ) {}

  private createAccessToken(payload: TUserJWTPayload): TAccessToken {
    return jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: `${CONFIG.access_token.expired_minutes}m`,
    });
  }

  private createRefreshToken(payload: Pick<TUserJWTPayload, 'id'>): TRefreshToken {
    return jwt.sign(payload, ENV.REFRESH_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: `${CONFIG.refresh_token.expired_days}d`,
    });
  }

  verifyAccessToken(token?: string) {
    // todo: Remove verify, just use decode
    if (!token) {
      return ResponseData.fail({
        message: 'Unauthorized',
        statusCode: StatusCodes.UNAUTHORIZED,
        data: this.renewAccessTokenDirection,
      });
    }
    try {
      const decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET) as TUserJWTPayload;
      return ResponseData.success({ data: decoded });
    } catch (error: any) {
      return ResponseData.fail({
        message: error?.message ?? 'Expired or invalid access token!',
        statusCode: StatusCodes.UNAUTHORIZED,
        data: this.renewAccessTokenDirection,
      });
    }
  }

  async refreshAccessToken(refreshToken$: string): Promise<
    TResponseData<{
      access_token: string;
      user: {
        id: number;
        name: string;
        email: string;
        bgImg: string | null;
        avatarImg: string | null;
      };
    }>
  > {
    const refreshToken = ZRefreshToken.optional().parse(refreshToken$);
    if (!refreshToken) {
      return ResponseData.fail({
        message: 'Invalid refresh token!',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const user = await this.userService.base.findFirst({
      where: { refresh_tokens: { some: { token: refreshToken } } },
      select: { ...UserDefaultSelect, permissions: { select: { permission_id: true } } },
    });
    if (!user) {
      return ResponseData.fail({
        message: 'Token is not valid!',
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // User JWT Payload - Access Token
    const userJWTPayload: TUserJWTPayload = {
      id: user.id,
      permissions: user.permissions.map((p) => p.permission_id),
    };
    console.log({ userJWTPayload });

    try {
      const decoded = jwt.verify(
        refreshToken,
        ENV.REFRESH_TOKEN_SECRET,
      ) as TUserJWTPayload;

      if (user.id !== decoded.id) {
        return ResponseData.fail({
          message: 'Token is not valid!!!',
          statusCode: StatusCodes.FORBIDDEN,
        });
      }

      const newAccessToken = this.createAccessToken(userJWTPayload);

      return ResponseData.success({
        data: {
          access_token: newAccessToken,
          user: UserDefaultDTO(user),
        },
      });
    } catch (error) {
      return ResponseData.fail({
        message: 'Expired or invalid refresh token!',
        statusCode: StatusCodes.FORBIDDEN,
      });
    }
  }

  async logIn(
    credentials: Pick<TUser, 'email' | 'password' | 'refresh_token'>,
  ): Promise<TResponseData<{ access_token: string; refresh_token: string } | null>> {
    const { email, password, refresh_token } = credentials;

    const user = await this.userService.base.findFirst({
      where: { email },
      include: {
        refresh_tokens: { select: { token: true } },
        permissions: { select: { permission_id: true } },
      },
    });
    if (!user) {
      return ResponseData.fail({
        message: 'User not found!',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return ResponseData.fail({
        message: 'Invalid credentials!',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    if (refresh_token) {
      // handle refresh token
      const foundToken = user.refresh_tokens.find(
        (token) => token.token === refresh_token,
      );
      // If token does not exist -> Token has been deleted before -> Reuse token attack!
      if (!foundToken) {
        logger.warn('Detected refresh token reuse! User is maybe being attacked!');
        // Xóa tất cả refresh token của user để bảo vệ tài khoản
        await this.userService.base.update({
          where: { id: user.id },
          data: { refresh_tokens: { deleteMany: {} } },
        });

        return ResponseData.fail({
          message: 'Suspicious activity detected! Please log in again.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }
    }

    if (user.refresh_tokens.length >= CONFIG.refresh_token.max_amount_per_user) {
      return ResponseData.fail({
        message:
          'You have reached the maximum device. Please log out from another device!',
        statusCode: StatusCodes.TOO_MANY_REQUESTS,
      });
      // Không hợp lý, hacker có thể đã đăng nhập vào nhiều thiết bị và đẩy người dùng thật ra.
    }

    // User JWT Payload - Access Token
    const userJWTPayload: TUserJWTPayload = {
      id: user.id,
      permissions: user.permissions.map((p) => p.permission_id),
    };
    const accessToken = this.createAccessToken(userJWTPayload);
    const newRefreshToken: TRefreshToken = this.createRefreshToken({ id: user.id });

    await DB.$transaction(async (tx) => {
      if (refresh_token) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            refresh_tokens: { deleteMany: { token: refresh_token } },
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          refresh_tokens: { create: { token: newRefreshToken } },
        },
      });
    });

    return ResponseData.success({
      data: {
        user: UserDefaultDTO(user),
        access_token: accessToken,
        refresh_token: newRefreshToken,
      },
    });
  }

  async logOut(refreshToken$: string) {
    const responseData = ResponseData.success({ data: true, message: 'Clear cookie!' });

    const { success, data: refreshToken } = ZRefreshToken.safeParse(refreshToken$);
    if (!success || !refreshToken) {
      return responseData;
    }

    const user = await this.userService.base.findFirst({
      where: { refresh_tokens: { some: { token: refreshToken } } },
    });
    if (user) {
      await this.userService.base.update({
        where: { id: user.id },
        data: { refresh_tokens: { delete: { token: refreshToken } } },
      });
    }

    return responseData;
  }

  async signUp(credentials: TUserCreateInput): Promise<TResponseData<TUser>> {
    const userExists = await this.userService.base.count({
      where: { email: credentials.email },
    });
    if (userExists > 0) {
      return ResponseData.fail({
        message: 'User already exists!',
        statusCode: StatusCodes.CONFLICT,
      });
    }

    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    credentials.password = hashedPassword;
    const createdUser = await this.userService.base.create({
      data: { ...credentials, refresh_tokens: undefined, permissions: undefined },
    });
    return ResponseData.success({
      data: createdUser,
      message: 'Create user successfully!',
      statusCode: StatusCodes.CREATED,
    });
  }
}
