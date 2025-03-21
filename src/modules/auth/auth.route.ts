import { Router } from 'express';
import { authController } from './auth.controller';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();

const refreshAccessTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 request mỗi 15 phút
  message: { error: 'Too many requests. Please try again later.' },
  headers: true, // Gửi header `RateLimit-*` để client biết
});

authRouter.post('/signup', authController.signup.bind(authController));
authRouter.post('/login', authController.login.bind(authController));
authRouter.post('/access-token', refreshAccessTokenLimiter, authController.refreshAccessToken.bind(authController));
// authRouter.post('/refresh-token', authController.refreshRefreshToken.bind(authController));
