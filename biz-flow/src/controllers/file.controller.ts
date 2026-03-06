import { Request, Response, NextFunction } from "express";
import { findUserByAccessCode } from "../services/user.service";
import { uploadFile, getUserFiles, deleteFile } from "../services/file.service";
import { log } from "../utils/logger";

/**
 * POST /files/upload
 * Handles single file upload (used by both Files page and Chat)
 */
export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessCode } = req.body;
    const file = req.file;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Authenticate user
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    // Validate file size (1MB limit)
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      res.status(400).json({ error: "File size exceeds 1MB limit" });
      return;
    }

    // Validate supported file types
    const supportedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "text/plain",
      "text/markdown",
      "text/csv",
    ];

    // Also check extensions just in case browser doesn't set mime correctly for some
    const supportedExtensions = [".docx", ".txt", ".md", ".csv"];
    const fileExtension = file.originalname
      .substring(file.originalname.lastIndexOf("."))
      .toLowerCase();

    if (
      !supportedMimeTypes.includes(file.mimetype) &&
      !supportedExtensions.includes(fileExtension)
    ) {
      res.status(400).json({ error: "Unsupported file type" });
      return;
    }

    log({
      event: "file_upload_started",
      userId: user.id,
      fileName: file.originalname,
    });

    const uploadedFile = await uploadFile(
      user.id,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    res.status(200).json({ file: uploadedFile });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /files
 * Lists user's files
 */
export const list = async (
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

    const files = await getUserFiles(user.id);
    res.status(200).json({ files });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /files/:id
 * Deletes a file
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
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

    await deleteFile(user.id, id);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    next(err);
  }
};
