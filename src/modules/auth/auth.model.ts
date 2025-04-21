// import { RefreshToken } from '@/generated/prisma'; // `RefreshToken reference
import { z } from 'zod';
import { NextFunction, Request, Response } from 'express';
import { TUser } from '../user/user.model';

export const ZRefreshToken = z.string().min(1).trim();
export const ZAccessToken = z.string().min(1).trim();

/**
 * Access token sẽ có cả permissions.
 *
 * Refresh token sẽ không có Permissions.
 */
export type TUserJWTPayload = Pick<TUser, 'id'> & { permissions: string[] };

export type TAccessToken = z.infer<typeof ZAccessToken>;
export type TRefreshToken = z.infer<typeof ZRefreshToken>;

export type TAuthRequest = Request & {
  user?: TUserJWTPayload;
};

// userlogin
// usersignup...
