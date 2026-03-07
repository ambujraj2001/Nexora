import { Router } from "express";
import {
  listRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getRoutineRunsSnapshot,
  getNotifications,
  generateCronExpression,
} from "../controllers/routine.controller";

const router = Router();

router.get("/", listRoutines);
router.post("/", createRoutine);
router.post("/generate-cron", generateCronExpression);
router.put("/:routineId", updateRoutine);
router.delete("/:routineId", deleteRoutine);
router.get("/:routineId/runs", getRoutineRunsSnapshot);
router.get("/notifications", getNotifications);

export default router;
