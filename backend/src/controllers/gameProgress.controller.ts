import { Response } from "express";
import { body } from "express-validator";
import GameProgress from "../models/GameProgress.js";
import { AuthRequest } from "../middleware/auth.js";
import { GameType } from "../models/User.js";

/**
 * Get game progress for a specific game
 */
export const getGameProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType } = req.params;

    let progress = await GameProgress.findOne({
      userId: req.userId,
      gameType: gameType as GameType,
    });

    // If no progress exists, create initial progress
    if (!progress) {
      progress = new GameProgress({
        userId: req.userId,
        gameType: gameType as GameType,
        level: 1,
        completedLevels: [],
        currentLevel: 1,
        totalScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(),
        gameSpecificData: new Map(),
      });
      await progress.save();
    }

    res.json({ progress });
  } catch (error) {
    console.error("Get game progress error:", error);
    res.status(500).json({ error: "Error fetching game progress" });
  }
};

/**
 * Get all game progress for current user
 */
export const getAllGameProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const allProgress = await GameProgress.find({ userId: req.userId });
    res.json({ progress: allProgress });
  } catch (error) {
    console.error("Get all game progress error:", error);
    res.status(500).json({ error: "Error fetching game progress" });
  }
};

/**
 * Update game progress
 */
export const updateGameProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType } = req.params;
    const {
      level,
      completedLevels,
      currentLevel,
      totalScore,
      timeSpent,
      gameSpecificData,
    } = req.body;

    let progress = await GameProgress.findOne({
      userId: req.userId,
      gameType: gameType as GameType,
    });

    if (!progress) {
      // Create new progress if it doesn't exist
      progress = new GameProgress({
        userId: req.userId,
        gameType: gameType as GameType,
        level: level || 1,
        completedLevels: completedLevels || [],
        currentLevel: currentLevel || 1,
        totalScore: totalScore || 0,
        timeSpent: timeSpent || 0,
        lastPlayed: new Date(),
        gameSpecificData: gameSpecificData || new Map(),
      });
    } else {
      // Update existing progress
      if (level !== undefined) progress.level = level;
      if (completedLevels !== undefined)
        progress.completedLevels = completedLevels;
      if (currentLevel !== undefined) progress.currentLevel = currentLevel;
      if (totalScore !== undefined) progress.totalScore = totalScore;
      if (timeSpent !== undefined) progress.timeSpent += timeSpent;
      if (gameSpecificData !== undefined) {
        progress.gameSpecificData = new Map(Object.entries(gameSpecificData));
      }
      progress.lastPlayed = new Date();
    }

    await progress.save();
    res.json({ progress });
  } catch (error) {
    console.error("Update game progress error:", error);
    res.status(500).json({ error: "Error updating game progress" });
  }
};

/**
 * Complete a level
 */
export const completeLevel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType } = req.params;
    const { level, score, timeSpent } = req.body;

    let progress = await GameProgress.findOne({
      userId: req.userId,
      gameType: gameType as GameType,
    });

    if (!progress) {
      progress = new GameProgress({
        userId: req.userId,
        gameType: gameType as GameType,
        level: 1,
        completedLevels: [],
        currentLevel: 1,
        totalScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(),
        gameSpecificData: new Map(),
      });
    }

    // Add level to completed levels if not already there
    if (!progress.completedLevels.includes(level)) {
      progress.completedLevels.push(level);
    }

    // Update current level if this was the current level
    if (level === progress.currentLevel) {
      progress.currentLevel = level + 1;
    }

    // Update score and time
    if (score !== undefined) progress.totalScore += score;
    if (timeSpent !== undefined) progress.timeSpent += timeSpent;
    progress.lastPlayed = new Date();

    await progress.save();
    res.json({ progress });
  } catch (error) {
    console.error("Complete level error:", error);
    res.status(500).json({ error: "Error completing level" });
  }
};

/**
 * Reset game progress (for testing or restart)
 */
export const resetGameProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType } = req.params;

    await GameProgress.findOneAndUpdate(
      { userId: req.userId, gameType: gameType as GameType },
      {
        level: 1,
        completedLevels: [],
        currentLevel: 1,
        totalScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(),
        gameSpecificData: new Map(),
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Game progress reset successfully" });
  } catch (error) {
    console.error("Reset game progress error:", error);
    res.status(500).json({ error: "Error resetting game progress" });
  }
};

/**
 * Validation rules
 */
export const updateProgressValidation = [
  body("gameType")
    .optional()
    .isIn(["phishing", "loophole", "judge", "architect", "veo", "laws"])
    .withMessage("Invalid game type"),
];

export const completeLevelValidation = [
  body("level")
    .isInt({ min: 1 })
    .withMessage("Level must be a positive integer"),
  body("score")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Score must be non-negative"),
  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Time spent must be non-negative"),
];
