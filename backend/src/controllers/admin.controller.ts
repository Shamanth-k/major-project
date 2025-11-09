import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import User from "../models/User.js";
import GameProgress from "../models/GameProgress.js";
import Assessment from "../models/Assessment.js";
import Analytics from "../models/Analytics.js";
import analyticsService from "../services/analytics.service.js";

/**
 * Get system-wide analytics (admin only)
 */
export const getSystemAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const analytics = await analyticsService.getAdminAnalytics();
    res.json({ analytics });
  } catch (error) {
    console.error("Get system analytics error:", error);
    res.status(500).json({ error: "Error fetching system analytics" });
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

/**
 * Get specific user details (admin only)
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const gameProgress = await GameProgress.find({ userId });
    const assessments = await Assessment.find({ userId });
    const analytics = await Analytics.find({ userId });

    res.json({
      user,
      gameProgress,
      assessments,
      analytics,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Error fetching user details" });
  }
};

/**
 * Update user role or level (admin only)
 */
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role, level, badges } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (role !== undefined) user.role = role;
    if (level !== undefined) user.level = level;
    if (badges !== undefined) user.badges = badges;

    await user.save();

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        level: user.level,
        badges: user.badges,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Error updating user" });
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Delete user and all associated data
    await User.findByIdAndDelete(userId);
    await GameProgress.deleteMany({ userId });
    await Assessment.deleteMany({ userId });
    await Analytics.deleteMany({ userId });

    res.json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};

/**
 * Get all game progress across all users (admin only)
 */
export const getAllGameProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allProgress = await GameProgress.find()
      .populate("userId", "email role level")
      .sort({ lastPlayed: -1 });

    res.json({ progress: allProgress, total: allProgress.length });
  } catch (error) {
    console.error("Get all game progress error:", error);
    res.status(500).json({ error: "Error fetching game progress" });
  }
};

/**
 * Get all assessments across all users (admin only)
 */
export const getAllAssessments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allAssessments = await Assessment.find()
      .populate("userId", "email role level")
      .sort({ completedAt: -1 });

    res.json({ assessments: allAssessments, total: allAssessments.length });
  } catch (error) {
    console.error("Get all assessments error:", error);
    res.status(500).json({ error: "Error fetching assessments" });
  }
};

/**
 * Get dashboard stats (admin only)
 */
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await GameProgress.countDocuments();
    const totalAssessments = await Assessment.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    // Recent activity
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentGames = await GameProgress.find()
      .populate("userId", "email")
      .sort({ lastPlayed: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalGames,
        totalAssessments,
        activeUsers,
      },
      recentUsers,
      recentGames,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Error fetching dashboard stats" });
  }
};
