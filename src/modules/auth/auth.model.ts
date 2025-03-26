import { z } from 'zod';
import { TUser } from '../user/user.model';
import { RefreshToken } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

/**
 * Access token sẽ có cả permissions.
 *
 * Refresh token sẽ không có Permissions.
 */
export type TUserJWTPayload = Pick<TUser, 'id'> & { permissions?: string[] };

export const RefreshTokenSchema = z.string().min(1).trim();
export type TRefreshTokenInput = Pick<RefreshToken, 'token'>;

export type TAuthRequest = Request & {
  user?: TUserJWTPayload;
};
