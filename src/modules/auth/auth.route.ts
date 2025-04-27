import { Router } from 'express';
import { authController } from './auth.controller';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './auth.middleware';

export const authRouter = Router();

const refreshAccessTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 request mỗi 15 phút
  message: { error: 'Too many requests. Please try again later.' },
  headers: true, // Gửi header `RateLimit-*` để client biết
});

authRouter.post('/signup', authController.signup.bind(authController));
authRouter.post('/login', authController.login.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));
authRouter.get(
  '/me',
  authMiddleware.decodeAccessToken().bind(authMiddleware),
  authController.me.bind(authController),
);
authRouter.post(
  '/access-token',
  refreshAccessTokenLimiter,
  authController.refreshAccessToken.bind(authController),
);
