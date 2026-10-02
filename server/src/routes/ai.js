import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { generateMessage } from '../controllers/aiController.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user.id.toString(),
  message: { error: 'You have reached the AI message limit (20 per hour). Please try again later.' }
});

router.use(requireAuth);
router.post('/message', aiLimiter, generateMessage);

export default router;
