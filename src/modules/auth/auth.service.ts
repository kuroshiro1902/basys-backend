import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ResponseData } from '@/modules/shared/models/response-data.model';
import { z } from 'zod';
import { ENV } from '@/environments/environment';
import { UserRepository } from '../user/user.repository';
import bcrypt from 'bcrypt';
import { TUser, UserInputSchema, UserSchema } from '../user/user.model';
import { RefreshTokenSchema, TRefreshTokenInput, TUserJWTPayload } from './auth.model';
import { ACCESS_TOKEN_EXPIRED_TIMESTAMP, REFRESH_TOKEN_EXPIRED_TIMESTAMP } from './auth.const';
import { logger } from '../logger';
import { FeaturePermissionSchema } from '../feature-permission/feature-permission.model';
import { EFeature } from '../feature-permission/feature-permission.const';
import { CONFIG } from '@/config/config';

export class AuthService {
  private renewAccessTokenDirection = 'VALID_ACCESS_TOKEN_REQUIRED';

  private userRepository: UserRepository;

  private _logInBodySchema = UserInputSchema.pick({ email: true, password: true }).extend({ refresh_token: RefreshTokenSchema.optional() });

  private _signUpBodySchema = UserInputSchema.pick({ email: true, password: true, name: true });

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  private createAccessToken(payload: TUserJWTPayload): string {
    return jwt.sign(
      { [UserSchema.keyof().enum.id]: payload.id, [UserSchema.keyof().enum.features]: payload.features ?? [] },
      ENV.ACCESS_TOKEN_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: `${CONFIG.access_token.expired_minutes}m`,
      },
    );
  }

  verifyAccessToken(token?: string) {
    if (!token) {
      return ResponseData.fail('Unauthorized', StatusCodes.UNAUTHORIZED, this.renewAccessTokenDirection);
    }
    try {
      const decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET) as TUserJWTPayload;
      return ResponseData.success(decoded);
    } catch (error: any) {
      return ResponseData.fail(
        error?.message ?? 'Expired or invalid access token!',
        StatusCodes.UNAUTHORIZED,
        this.renewAccessTokenDirection,
      );
    }
  }

  private createRefreshToken(payload: TUserJWTPayload): string {
    return jwt.sign(
      { [UserSchema.keyof().enum.id]: payload.id, [UserSchema.keyof().enum.features]: payload.features ?? [] },
      ENV.REFRESH_TOKEN_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: `${CONFIG.refresh_token.expired_days}d`,
      },
    );
  }

  async refreshAccessToken(
    refreshToken$: string,
  ): Promise<ResponseData<{ access_token: string; user: Pick<TUser, 'id' | 'name' | 'email'> } | null>> {
    const refreshToken = RefreshTokenSchema.optional().parse(refreshToken$);
    if (!refreshToken) {
      return ResponseData.fail('Invalid refresh token!', StatusCodes.UNAUTHORIZED);
    }

    const user = await this.userRepository.findOne({
      where: { refresh_tokens: { some: { token: refreshToken } } },
      select: { id: true, name: true, email: true, features: { select: { feature_id: true } } },
    });
    if (!user) {
      return ResponseData.fail('Token is not valid!', StatusCodes.FORBIDDEN);
    }

    const userJWTPayload: TUserJWTPayload = { id: user.id, features: user.features.map(({ feature_id: id }) => ({ id })) };

    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET) as TUserJWTPayload;

      if (user.id !== decoded.id) {
        return ResponseData.fail('Token is not valid!!!', StatusCodes.FORBIDDEN);
      }

      const newAccessToken = this.createAccessToken(userJWTPayload);

      const { features, ...userDTO } = user;
      return ResponseData.success({ access_token: newAccessToken, user: userDTO });
    } catch (error) {
      return ResponseData.fail('Expired or invalid refresh token!', StatusCodes.FORBIDDEN);
    }
  }

  async refreshRefreshToken(
    refreshToken$: string,
  ): Promise<ResponseData<{ user: Pick<TUser, 'id' | 'name' | 'email'>; access_token: string; refresh_token: string } | null>> {
    const refreshToken = RefreshTokenSchema.optional().parse(refreshToken$);
    if (!refreshToken) {
      return ResponseData.fail('Invalid refresh token!', StatusCodes.UNAUTHORIZED);
    }

    const user = await this.userRepository.findOne({
      where: { refresh_tokens: { some: { token: refreshToken } } },
      select: {
        id: true,
        name: true,
        email: true,
        // refresh_tokens: { select: { token: true, created_at: true } },
        features: { select: { feature_id: true } },
      },
    });
    if (!user) {
      return ResponseData.fail('Invalid refresh token!', StatusCodes.FORBIDDEN);
    }

    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET) as TUserJWTPayload;

      if (user.id !== decoded.id) {
        await this.userRepository.update({ where: { id: user.id }, data: { refresh_tokens: { delete: { token: refreshToken } } } });
        return ResponseData.fail('Invalid refresh token!', StatusCodes.FORBIDDEN);
      }

      const userJWTPayload: TUserJWTPayload = { id: user.id, features: user.features.map(({ feature_id: id }) => ({ id })) };
      // Tạo Access Token và Refresh Token mới
      const newAccessToken = this.createAccessToken(userJWTPayload);

      const expiresAt = REFRESH_TOKEN_EXPIRED_TIMESTAMP();
      const newRefreshToken: TRefreshTokenInput = { token: this.createRefreshToken(userJWTPayload) };

      // Cập nhật danh sách refresh token trong database
      await this.userRepository.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { refresh_tokens: { deleteMany: { token: refreshToken } } },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { refresh_tokens: { create: newRefreshToken } },
        });
      });

      const { features, ...userDTO } = user;
      return ResponseData.success({
        user: userDTO,
        access_token: newAccessToken,
        refresh_token: newRefreshToken.token,
        expired_at: expiresAt,
      });
    } catch (error: any) {
      // Nếu refresh token hết hạn hoặc không hợp lệ, xóa nó khỏi DB.
      await this.userRepository.update({ where: { id: user.id }, data: { refresh_tokens: { delete: { token: refreshToken } } } });
      return ResponseData.fail('Verify refresh token fail! ' + error.message || '', StatusCodes.FORBIDDEN);
    }
  }

  async logIn(user$: z.input<typeof this._logInBodySchema>): Promise<ResponseData<{ access_token: string; refresh_token: string } | null>> {
    const { email, password, refresh_token } = this._logInBodySchema.parse(user$);

    const user = await this.userRepository.findOne({
      where: { email },
      include: { features: { select: { feature_id: true } }, refresh_tokens: { select: { token: true } } },
    });
    if (!user) {
      return ResponseData.fail('User not found!', StatusCodes.NOT_FOUND);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return ResponseData.fail('Invalid credentials!', StatusCodes.UNAUTHORIZED);
    }

    if (refresh_token) {
      // handle refresh token
      const foundToken = user.refresh_tokens.find((token) => token.token === refresh_token);
      // If token does not exist -> Token has been deleted before -> Reuse token attack!
      if (!foundToken) {
        logger.warn('Detected refresh token reuse! User is maybe being attacked!');
        // Xóa tất cả refresh token của user để bảo vệ tài khoản
        await this.userRepository.update({
          where: { id: user.id },
          data: { refresh_tokens: { deleteMany: {} } },
        });

        return ResponseData.fail('Suspicious activity detected! Please log in again.', StatusCodes.UNAUTHORIZED);
      }
    }

    if (user.refresh_tokens.length >= CONFIG.refresh_token.max_amount_per_user) {
      return ResponseData.fail('You have reached the maximum device. Please log out from another device!', StatusCodes.TOO_MANY_REQUESTS);
      // Không hợp lý, hacker có thể đã đăng nhập vào nhiều thiết bị và đẩy người dùng thật ra.
    }
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZmVhdHVyZXMiOltdLCJpYXQiOjE3NDI0ODEyMTgsImV4cCI6MTc0Mjc0MDQxOH0.YKjX2-nMOQYiqUs4shVcQiWkddB9Z8WTDhwANgA51Mk

    const features = user.features.map(({ feature_id: id }) => ({ id }));
    const accessToken = this.createAccessToken({ id: user.id, features });
    const newRefreshToken: TRefreshTokenInput = {
      token: this.createRefreshToken({ id: user.id, features }),
    };

    await this.userRepository.$transaction(async (tx) => {
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
          refresh_tokens: { create: { token: newRefreshToken.token } },
        },
      });
    });

    const { features: _, refresh_tokens, password: __, ...userDTO } = user;
    return ResponseData.success({ user: userDTO, access_token: accessToken, refresh_token: newRefreshToken.token });
  }

  async logOut(refreshToken$: string) {
    const responseData = ResponseData.success(StatusCodes.OK, 'Clear cookie!');

    const { success, data: refreshToken } = RefreshTokenSchema.safeParse(refreshToken$);
    if (!success || !refreshToken) {
      return responseData;
    }

    const user = await this.userRepository.findOne({ where: { refresh_tokens: { some: { token: refreshToken } } } });
    if (user) {
      await this.userRepository.update({ where: { id: user.id }, data: { refresh_tokens: { delete: { token: refreshToken } } } });
    }

    return responseData;
  }

  async signUp(user$: z.input<typeof this._signUpBodySchema>) {
    const user = this._signUpBodySchema.parse(user$);
    const userExists = await this.userRepository.findOne({ where: { email: user.email } });
    if (userExists) {
      return ResponseData.fail('User already exists!', StatusCodes.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    const createdUser = await this.userRepository.create({ data: user, omit: { password: true } });
    return ResponseData.success(createdUser, 'Create user successfully!', StatusCodes.CREATED);
  }
}

export const authService = new AuthService();
