import { Router } from 'express';
import { runReminders } from '../services/reminderService.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/run-reminders', async (req, res) => {
  if (env.NODE_ENV === 'production' && !env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Manual reminders disabled in production without ADMIN_TOKEN' });
  }
  
  if (env.ADMIN_TOKEN) {
    const authHeader = req.headers.authorization || req.headers['admin-token'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    if (token !== env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  const counts = await runReminders();
  res.json({ message: 'Reminders triggered', counts });
});

export default router;
