import { z } from 'zod';
import { TUser } from '../user/user.model';
import { RefreshToken } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
export type TUserJWTPayload = Pick<TUser, 'id' | 'features'>;

export const RefreshTokenSchema = z.string().min(1).trim();
export type TRefreshTokenInput = Pick<RefreshToken, 'token'>;

export type TAuthRequest = Request & {
  user?: TUserJWTPayload;
};
