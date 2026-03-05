import { Router } from 'express';
import { chat } from '../controllers/chat.controller';

const router = Router();

// POST /chat
router.post('/', chat);

export default router;
