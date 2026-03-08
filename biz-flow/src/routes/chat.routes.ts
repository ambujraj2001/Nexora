import { Router } from "express";
import {
  chat,
  getHistory,
  getMemories,
  getKnowledge,
  getJournal,
  getTasks,
  getReminders,
  getInsights,
  deleteHistory,
} from "../controllers/chat.controller";

const router = Router();

// POST /chat
router.post("/", chat);

// GET /chat/history
router.get("/history", getHistory);

// DELETE /chat/history
router.delete("/history", deleteHistory);

// GET /chat/memories
router.get("/memories", getMemories);

// GET /chat/journal
router.get("/journal", getJournal);

// GET /chat/knowledge
router.get("/knowledge", getKnowledge);

// GET /chat/tasks
router.get("/tasks", getTasks);

// GET /chat/reminders
router.get("/reminders", getReminders);

// GET /chat/insights
router.get("/insights", getInsights);

export default router;
