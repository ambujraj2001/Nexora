import { Router } from "express";
import multer from "multer";
import * as fileController from "../controllers/file.controller";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
});

// Routes
router.post("/upload", upload.single("file"), fileController.upload);
router.get("/", fileController.list);
router.delete("/:id", fileController.remove);

export default router;
