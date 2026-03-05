import { Request, Response, NextFunction } from 'express';
import { findUserByAccessCode } from '../services/user.service';
import { runAgent } from '../agents/chatAgent';
import { ChatRequestBody, ChatResponse } from '../types/chat.types';
import { log } from '../utils/logger';

// ─── POST /chat ───────────────────────────────────────────────────────────────

export const chat = async (
  req: Request<object, object, ChatRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { message, accessCode } = req.body;

    log({
      event: 'chat_request_received',
      message: message?.trim(),
    });

    // ── Validation ────────────────────────────────────────────────────────────
    if (!accessCode?.trim()) {
      res.status(400).json({ error: 'accessCode is required' });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    // ── Authenticate via existing user service ────────────────────────────────
    log({ event: 'user_validation_started' });
    const user = await findUserByAccessCode(accessCode.trim());

    if (!user) {
      log({ event: 'user_validation_failed' });
      res.status(401).json({ error: 'Invalid access code' });
      return;
    }

    log({
      event: 'user_validated',
      userId: user.id,
      userName: user.full_name,
    });

    // ── Run the AI agent ──────────────────────────────────────────────────────
    const reply = await runAgent(message.trim(), user);

    const response: ChatResponse = { reply };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
