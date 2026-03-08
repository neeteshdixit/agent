import { Router } from 'express';
import { getTaskHistory, runTask } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { taskRunSchema } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/history', asyncHandler(getTaskHistory));
router.post('/run', validateBody(taskRunSchema), asyncHandler(runTask));

export default router;
