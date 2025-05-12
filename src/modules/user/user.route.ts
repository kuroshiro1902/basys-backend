import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { EPermission } from '../permission/permission.const';
export const userRouter = Router();

userRouter.get(
  '/all',
  authMiddleware.decodeAccessToken.bind(authMiddleware),
  // TODO: Test with normal user
  authMiddleware.checkPermission({ some: [EPermission.admin] }).bind(authMiddleware),
  userController.getAllUsers.bind(userController),
);
