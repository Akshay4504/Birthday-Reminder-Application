import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

router.use(authLimiter);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
