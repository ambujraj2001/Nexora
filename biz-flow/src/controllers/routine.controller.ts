import { Request, Response, NextFunction } from "express";
import { findUserByAccessCode } from "../services/user.service";
import * as routineService from "../services/routine.service";
import { buildModel } from "../config/model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const listRoutines = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    const routines = await routineService.getUserRoutines(user.id);
    res.json({ routines });
  } catch (err) {
    next(err);
  }
};

export const createRoutine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, instruction, cronExpression, accessCode } = req.body;
    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }
    const routine = await routineService.createRoutine({
      user_id: user.id,
      name,
      instruction,
      cron_expression: cronExpression,
    });
    res.json(routine);
  } catch (err) {
    next(err);
  }
};

export const updateRoutine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { routineId } = req.params;
    const { name, instruction, cronExpression, isActive } = req.body;
    const routine = await routineService.updateRoutine(routineId, {
      name,
      instruction,
      cron_expression: cronExpression,
      is_active: isActive,
    });
    res.json(routine);
  } catch (err) {
    next(err);
  }
};

export const deleteRoutine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { routineId } = req.params;
    await routineService.deleteRoutine(routineId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getRoutineRunsSnapshot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { routineId } = req.params;
    const runs = await routineService.getRoutineRuns(routineId);
    res.json({ runs });
  } catch (err) {
    next(err);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    const notifications = await routineService.getUserNotifications(user.id);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

export const generateCronExpression = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const model = buildModel();
    const systemMessage = new SystemMessage(`
      You are a Cron Expression Generator.
      The user will provide a natural language schedule (e.g., "every morning at 9am", "mondays at 5pm", "every minute").
      Your task is to convert this into a standard 5-part cron expression (Min Hour Day Month Week).
      Output ONLY the cron expression itself. No explanation, no quotes, no extra characters.
      Example: "0 9 * * *"
    `);
    const humanMessage = new HumanMessage(prompt);

    const response = await model.invoke([systemMessage, humanMessage]);
    const cronExpression = (response.content as string).trim();

    res.json({ cronExpression });
  } catch (err) {
    next(err);
  }
};
