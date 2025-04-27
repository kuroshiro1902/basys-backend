import { Router } from 'express';
import { authRouter } from './modules/auth/auth.route';
import { userRouter } from './modules/user/user.route';
const router = Router();

router.get('', (req, res) => {
  res.send(`
      <div style="height: 100vh; display: flex; justify-content: center; align-items: center">
        <h1 style="color: teal">BASYS API!</h1>
      </div>
    `);
});

router.use('/auth', authRouter);
router.use('/user', userRouter);

export default router;
