import express from "express";
import {
  getUserAnalytics,
  getGameAnalytics,
  updateAnalytics,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all analytics for current user
router.get("/", getUserAnalytics);

// Get analytics for specific game
router.get("/:gameType", getGameAnalytics);

// Manually update analytics
router.post("/update", updateAnalytics);

export default router;
