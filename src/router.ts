import { Router } from 'express';
import { authRouter } from './modules/auth/auth.route';
const router = Router();

router.get('', (req, res) => {
  res.send(`
      <div style="height: 100vh; display: flex; justify-content: center; align-items: center">
        <h1 style="color: teal">SLS ETL API!</h1>
      </div>
    `);
});
router.use('/auth', authRouter);

export default router;
