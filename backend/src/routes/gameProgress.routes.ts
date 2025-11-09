import express from "express";
import {
  getGameProgress,
  getAllGameProgress,
  updateGameProgress,
  completeLevel,
  resetGameProgress,
  updateProgressValidation,
  completeLevelValidation,
} from "../controllers/gameProgress.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/errorHandler.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all progress for user
router.get("/", getAllGameProgress);

// Get progress for specific game
router.get("/:gameType", getGameProgress);

// Update game progress
router.put(
  "/:gameType",
  updateProgressValidation,
  validate,
  updateGameProgress
);

// Complete a level
router.post(
  "/:gameType/complete",
  completeLevelValidation,
  validate,
  completeLevel
);

// Reset game progress
router.delete("/:gameType/reset", resetGameProgress);

export default router;
