import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ResponseData } from '@/modules/shared/models/response-data.model';
import { z } from 'zod';
import { ENV } from '@/environments/environment';
import bcrypt from 'bcrypt';
import { TUser, UserDefaultDTO, UserDefaultSelect, UserInputSchema, UserSchema } from '../user/user.model';
import { RefreshTokenSchema, TRefreshTokenInput, TUserJWTPayload } from './auth.model';
import { logger } from '../logger';
import { CONFIG } from '@/config/config';
import { UserRepository } from '../user/user.repository';
import { PermissionRepository } from '../permission/permission.repository';

export class AuthService {
  private renewAccessTokenDirection = 'VALID_ACCESS_TOKEN_REQUIRED';

  private _logInBodySchema = UserInputSchema.pick({ email: true, password: true }).extend({ refresh_token: RefreshTokenSchema.optional() });

  private _signUpBodySchema = UserInputSchema.pick({ email: true, password: true, name: true });

  constructor(private userRepository = new UserRepository(), private permissionRepository = new PermissionRepository()) {}

  private createAccessToken(payload: TUserJWTPayload): string {
    return jwt.sign({ [UserSchema.keyof().enum.id]: payload.id }, ENV.ACCESS_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: `${CONFIG.access_token.expired_minutes}m`,
    });
  }

  private createRefreshToken(payload: TUserJWTPayload): string {
    return jwt.sign({ [UserSchema.keyof().enum.id]: payload.id }, ENV.REFRESH_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: `${CONFIG.refresh_token.expired_days}d`,
    });
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

  async refreshAccessToken(
    refreshToken$: string,
  ): Promise<ResponseData<{ access_token: string; user: Pick<TUser, 'id' | 'name' | 'email'> } | null>> {
    const refreshToken = RefreshTokenSchema.optional().parse(refreshToken$);
    if (!refreshToken) {
      return ResponseData.fail('Invalid refresh token!', StatusCodes.UNAUTHORIZED);
    }

    const user = await this.userRepository.findOne({
      where: { refresh_tokens: { some: { token: refreshToken } } },
      select: { ...UserDefaultSelect, permissions: { select: { permission_id: true } } },
    });
    if (!user) {
      return ResponseData.fail('Token is not valid!', StatusCodes.FORBIDDEN);
    }

    // User JWT Payload - Access Token
    const userJWTPayload: TUserJWTPayload = { id: user.id, permissions: user.permissions.map((p) => p.permission_id) };
    console.log({ userJWTPayload });

    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET) as TUserJWTPayload;

      if (user.id !== decoded.id) {
        return ResponseData.fail('Token is not valid!!!', StatusCodes.FORBIDDEN);
      }

      const newAccessToken = this.createAccessToken(userJWTPayload);

      return ResponseData.success({ access_token: newAccessToken, user: UserDefaultDTO(user) });
    } catch (error) {
      return ResponseData.fail('Expired or invalid refresh token!', StatusCodes.FORBIDDEN);
    }
  }

  async logIn(user$: z.input<typeof this._logInBodySchema>): Promise<ResponseData<{ access_token: string; refresh_token: string } | null>> {
    const { email, password, refresh_token } = this._logInBodySchema.parse(user$);

    const user = await this.userRepository.findOne({
      where: { email },
      include: { refresh_tokens: { select: { token: true } }, permissions: { select: { permission_id: true } } },
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

    // User JWT Payload - Access Token
    const userJWTPayload: TUserJWTPayload = { id: user.id, permissions: user.permissions.map((p) => p.permission_id) };
    const accessToken = this.createAccessToken(userJWTPayload);
    const newRefreshToken: TRefreshTokenInput = {
      token: this.createRefreshToken({ id: user.id }), // Không có permissions
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

    return ResponseData.success({ user: UserDefaultDTO(user), access_token: accessToken, refresh_token: newRefreshToken.token });
  }

  async logOut(refreshToken$: string) {
    const responseData = ResponseData.success(true, 'Clear cookie!');

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
