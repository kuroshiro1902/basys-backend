import { Router } from 'express';
import elasticRouter from './modules/elastic/elastic.routes';
const router = Router();

router.get('', (req, res) => {
  res.send(`
      <div style="height: 100vh; display: flex; justify-content: center; align-items: center">
        <h1 style="color: teal">SLS ETL API!</h1>
      </div>
    `);
});
router.use('/elastic', elasticRouter);
// api đọc file từ khóa để lên product có thể biết được file từ khóa đã được đọc hay chưa

export default router;
