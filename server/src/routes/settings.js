import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { updateSettings, deleteAccount } from '../controllers/settingsController.js';

const router = Router();
router.use(requireAuth);

router.patch('/settings', updateSettings);
router.delete('/account', deleteAccount);

export default router;
