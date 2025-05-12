// import { User } from '@prisma/client'; // User reference

import { z } from 'zod';
import { ZPermission } from '../permission/permission.model';
import { ZRefreshToken } from '../auth/auth.model';
import { TTimestamp } from '../shared/models/timestamp.model';

export const ZUser = z.object({
  id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  name: z.string().trim().min(5).max(255),
  email: z.string().email().trim(),
  password: z.string().trim().min(6).max(255),
  avatarImg: z.string().max(500).nullable().default(null),
  bgImg: z.string().max(500).nullable().default(null),
  permissions: z.array(ZPermission).optional(),
  refresh_token: ZRefreshToken.optional(),
});

export const ZUserCreateInput = ZUser.pick({
  name: true,
  email: true,
  password: true,
  avatarImg: true,
  bgImg: true,
});

export const UserDefaultSelect = {
  id: true,
  name: true,
  email: true,
  avatarImg: true,
  bgImg: true,
};

export const UserDefaultDTO = (
  user: Pick<TUser, 'id' | 'name' | 'email' | 'bgImg' | 'avatarImg'>,
) => {
  const { id, name, email, bgImg, avatarImg } = user;
  return { id, name, email, bgImg, avatarImg };
};

export type TUser = z.infer<typeof ZUser> & TTimestamp;
export type TUserCreateInput = z.infer<typeof ZUserCreateInput>;
// export type TUserSelect = Prisma.UserSelect;
