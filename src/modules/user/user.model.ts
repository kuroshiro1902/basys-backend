import { z } from 'zod';
import { PermissionSchema } from '../permission/permission.model';
import { Prisma } from '@prisma/client';

export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(5).max(255),
  email: z.string().email().trim(),
  password: z.string().trim().min(6).max(255),
  avatarImg: z.string().max(500).nullable().default(null),
  bgImg: z.string().max(500).nullable().default(null),
  permissions: z.array(PermissionSchema).nullable().default([]),
});

export const UserInputSchema = UserSchema.pick({
  name: true,
  email: true,
  password: true,
  permissions: true,
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

export const UserDefaultDTO = (user: Pick<TUser, 'id' | 'name' | 'email' | 'bgImg' | 'avatarImg'> & Record<string, any>) => {
  const { id, name, email, bgImg, avatarImg } = user;
  return { id, name, email, bgImg, avatarImg };
};

export type TUser = z.infer<typeof UserSchema>;
export type TUserInput = z.input<typeof UserInputSchema>;
export type TUserSelect = Prisma.UserSelect;
