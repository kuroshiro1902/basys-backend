import { z } from 'zod';
import { FeaturePermissionSchema } from '../feature-permission/feature-permission.model';
import { EFeature } from '../feature-permission/feature-permission.const';

export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  features: z.array(FeaturePermissionSchema).optional(),
});

export const UserInputSchema = z.object({
  name: UserSchema.shape.name.trim().min(5).max(255),
  email: UserSchema.shape.email.trim(),
  password: UserSchema.shape.password.trim().min(6).max(255),
  features: UserSchema.shape.features.default([]),
});

export type TUser = z.infer<typeof UserSchema>;
export type TUserInput = z.input<typeof UserInputSchema>;
