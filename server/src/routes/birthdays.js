import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getBirthdays, createBirthday, updateBirthday, deleteBirthday } from '../controllers/birthdaysController.js';

const router = Router();
router.use(requireAuth);

router.get('/', getBirthdays);
router.post('/', createBirthday);
router.put('/:id', updateBirthday);
router.delete('/:id', deleteBirthday);

export default router;
