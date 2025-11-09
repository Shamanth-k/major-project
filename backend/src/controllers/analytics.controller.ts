import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { GameType } from "../models/User.js";
import analyticsService from "../services/analytics.service.js";

/**
 * Get comprehensive analytics for current user
 */
export const getUserAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const analytics = await analyticsService.getUserAnalytics(req.userId!);
    res.json({ analytics });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json({ error: "Error fetching analytics" });
  }
};

/**
 * Get analytics for a specific game
 */
export const getGameAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType } = req.params;

    const analytics = await analyticsService.getGameAnalytics(
      req.userId!,
      gameType as GameType
    );

    res.json({ analytics });
  } catch (error) {
    console.error("Get game analytics error:", error);
    res.status(500).json({ error: "Error fetching game analytics" });
  }
};

/**
 * Manually trigger analytics update (after post-assessment)
 */
export const updateAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType, level } = req.body;

    const analytics = await analyticsService.updateAnalytics(
      req.userId!,
      gameType as GameType,
      level
    );

    res.json({ analytics });
  } catch (error) {
    console.error("Update analytics error:", error);
    res.status(500).json({ error: "Error updating analytics" });
  }
};
