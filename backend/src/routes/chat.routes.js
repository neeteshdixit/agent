import { Router } from 'express';
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  sendMessage,
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { chatMessageSchema } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/sessions', asyncHandler(listSessions));
router.post('/sessions', asyncHandler(createSession));
router.get('/sessions/:sessionId', asyncHandler(getSession));
router.delete('/sessions/:sessionId', asyncHandler(deleteSession));
router.post('/message', validateBody(chatMessageSchema), asyncHandler(sendMessage));

export default router;
