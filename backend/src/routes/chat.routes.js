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
import { chatMessageSchema } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.delete('/sessions/:sessionId', deleteSession);
router.post('/message', validateBody(chatMessageSchema), sendMessage);

export default router;
