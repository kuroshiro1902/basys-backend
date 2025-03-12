import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ResponseData } from '@/modules/shared/models/response-data.model';
import { z } from 'zod';
import { ENV } from '@/environments/environment';
import { UserRepository } from '../user/user.repository';
import bcrypt from 'bcrypt';
import { TUser, UserInputSchema, UserSchema } from '../user/user.model';
import { RefreshTokenSchema, TRefreshToken, TUserJWTPayload } from './auth.model';
import { ACCESS_TOKEN_EXPIRED_TIMESTAMP, REFRESH_TOKEN_EXPIRED_TIMESTAMP } from './auth.const';
import { logger } from '../logger';
import { FeaturePermissionSchema } from '../feature-permission/feature-permission.model';

export class AuthService {
  private userRepository: UserRepository;

  private _logInBodySchema = UserInputSchema.pick({ email: true, password: true }).extend({ refresh_token: RefreshTokenSchema.optional() });

  private _signUpBodySchema = UserInputSchema.pick({ email: true, password: true, name: true, features: true });

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  private createAccessToken(payload: TUserJWTPayload): string {
    return jwt.sign(
      { [UserSchema.keyof().enum.id]: payload.id, [UserSchema.keyof().enum.features]: payload.features ?? [] },
      ENV.ACCESS_TOKEN_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: ACCESS_TOKEN_EXPIRED_TIMESTAMP(),
      },
    );
  }

  private createRefreshToken(payload: TUserJWTPayload): string {
    return jwt.sign(
      { [UserSchema.keyof().enum.id]: payload.id, [UserSchema.keyof().enum.features]: payload.features ?? [] },
      ENV.REFRESH_TOKEN_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: REFRESH_TOKEN_EXPIRED_TIMESTAMP(),
      },
    );
  }

  async handleRefreshToken(refreshToken$: string): Promise<ResponseData> {
    const refreshToken = RefreshTokenSchema.optional().parse(refreshToken$);
    if (!refreshToken) {
      return ResponseData.fail('Invalid refresh token!', StatusCodes.UNAUTHORIZED);
    }

    // Tìm user theo refreshToken
    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (!user) {
      return ResponseData.fail('Cannot find User!', StatusCodes.FORBIDDEN);
    }

    // Xóa refresh token cũ khỏi danh sách
    const newRefreshTokenArr = user.refresh_tokens.filter((token) => token.token !== refreshToken);

    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET) as TUserJWTPayload;

      if (user.id !== decoded.id) {
        return ResponseData.fail('Token is not valid!!!', StatusCodes.FORBIDDEN);
      }

      // Tạo Access Token và Refresh Token mới
      const newAccessToken = this.createAccessToken(user);

      const expiresAt = REFRESH_TOKEN_EXPIRED_TIMESTAMP();
      const newRefreshToken: TRefreshToken = { token: this.createRefreshToken(user), expiresAt, user_id: user.id };

      // Cập nhật danh sách refresh token trong database
      await this.userRepository.setRefreshTokens(user.id, [...newRefreshTokenArr, newRefreshToken]);

      return ResponseData.success({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      // Nếu refresh token hết hạn, xóa nó khỏi DB
      await this.userRepository.setRefreshTokens(user.id, newRefreshTokenArr);
      return ResponseData.fail('Expired Refresh token!', StatusCodes.FORBIDDEN);
    }
  }

  async logIn(user$: z.input<typeof this._logInBodySchema>): Promise<ResponseData<{ accessToken: string; refreshToken: string } | null>> {
    const { email: username, password, refresh_token } = this._logInBodySchema.parse(user$);

    const user = await this.userRepository.findByEmail(username);
    if (!user) {
      return ResponseData.fail('User not found!', StatusCodes.NOT_FOUND);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return ResponseData.fail('Invalid credentials!', StatusCodes.UNAUTHORIZED);
    }

    const features = user.features.map(({ feature }) => feature);
    const accessToken = this.createAccessToken({ id: user.id, features });
    const newRefreshToken: TRefreshToken = {
      token: this.createRefreshToken({ id: user.id, features }),
      user_id: user.id,
      expiresAt: REFRESH_TOKEN_EXPIRED_TIMESTAMP(),
    };

    if (refresh_token) {
      const foundToken = user.refresh_tokens.find((token) => token.token === refresh_token);
      if (!foundToken) {
        logger.warn('Detected refresh token reuse! User is maybe being attacked!');
        await this.userRepository.resetRefreshTokens(user.id, [newRefreshToken]);
      } else {
        const notDuplicatedRefreshTokenArr = Object.values(
          [...user.refresh_tokens, newRefreshToken].reduce((acc, token) => {
            return { ...acc, [token.token]: token };
          }, {} as Record<string, TRefreshToken>),
        );
        await this.userRepository.setRefreshTokens(user.id, notDuplicatedRefreshTokenArr);
      }
    }

    const { name } = user;
    return ResponseData.success({ user: { name }, accessToken, refreshToken: newRefreshToken.token });
  }

  async logOut(refreshToken$: string) {
    const responseData = ResponseData.success(StatusCodes.OK, 'Clear cookie!');

    const { success, data: refreshToken } = RefreshTokenSchema.safeParse(refreshToken$);
    if (!success || !refreshToken) {
      return responseData;
    }

    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (user) {
      await this.userRepository.setRefreshTokens(
        user.id,
        user.refresh_tokens.filter(({ token }) => token !== refreshToken),
      );
    }

    return responseData;
  }

  async signUp(user$: z.input<typeof this._signUpBodySchema>) {
    const user = this._signUpBodySchema.parse(user$);
    const userExists = await this.userRepository.findByEmail(user.email);
    if (userExists) {
      return ResponseData.fail('User already exists!', StatusCodes.CONFLICT);
    }
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      const { password, ...createdUser } = await this.userRepository.createOne(user);
      return ResponseData.success(createdUser, 'Create user successfully!', StatusCodes.CREATED);
    } catch (error) {
      return ResponseData.fail('An error occurred while signing up!', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
