import { Router } from 'express';
import { getTaskHistory, runTask } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { taskRunSchema } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/history', getTaskHistory);
router.post('/run', validateBody(taskRunSchema), runTask);

export default router;
