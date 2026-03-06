import { Request, Response, NextFunction } from "express";
import { findUserByAccessCode } from "../services/user.service";
import { getUserTasks } from "../services/task.service";
import { getUserChatHistory } from "../services/chat.service";
import { runAgent } from "../agents/chatAgent";
import {
  ChatRequestBody,
  ChatResponse,
  ChatHistoryResponse,
} from "../types/chat.types";
import { log } from "../utils/logger";

// ─── POST /chat ───────────────────────────────────────────────────────────────

export const chat = async (
  req: Request<object, object, ChatRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { message, accessCode, conversationId } = req.body;

    log({
      event: "chat_request_received",
      message: message?.trim(),
    });

    // ── Validation ────────────────────────────────────────────────────────────
    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // ── Authenticate via existing user service ────────────────────────────────
    log({ event: "user_validation_started" });
    const user = await findUserByAccessCode(accessCode.trim());

    if (!user) {
      log({ event: "user_validation_failed" });
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    log({
      event: "user_validated",
      userId: user.id,
      userName: user.full_name,
    });

    // ── Run the AI agent ──────────────────────────────────────────────────────
    const reply = await runAgent(message.trim(), user, conversationId);

    const response: ChatResponse = { reply };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/history ────────────────────────────────────────────────────────

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const messages = await getUserChatHistory(user.id);
    const response: ChatHistoryResponse = { messages };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/memories ───────────────────────────────────────────────────────

import {
  getUserMemories,
  getUserKnowledge,
  getUserJournal,
} from "../services/entry.service";
import { getUserReminders } from "../services/reminder.service";
import { generateInsights } from "../services/insights.service";

export const getMemories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const memories = await getUserMemories(user.id);

    res.status(200).json({ memories });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/journal ────────────────────────────────────────────────────────

export const getJournal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const journal = await getUserJournal(user.id);

    res.status(200).json({ journal });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/knowledge ──────────────────────────────────────────────────────

export const getKnowledge = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const knowledge = await getUserKnowledge(user.id);

    res.status(200).json({ knowledge });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/tasks ──────────────────────────────────────────────────────────

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const tasks = await getUserTasks(user.id);

    res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/reminders ──────────────────────────────────────────────────────

export const getReminders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const reminders = await getUserReminders(user.id);

    res.status(200).json({ reminders });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/insights ───────────────────────────────────────────────────────

export const getInsights = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const { startDate, endDate } = req.query;

    const insights = await generateInsights(
      user.id,
      startDate as string,
      endDate as string,
    );

    res.status(200).json({ insights });
  } catch (err) {
    next(err);
  }
};
