import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import User from "../models/User.js";

/**
 * Get leaderboard with top users by level
 */
export const getLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get top 10 users sorted by level (descending)
    const topUsers = await User.find({ role: "user" })
      .select("email level")
      .sort({ level: -1 })
      .limit(10)
      .lean();

    // Format the leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      email: user.email,
      level: user.level,
      isCurrentUser: user._id.toString() === req.userId,
    }));

    res.json({ leaderboard });
  } catch (error: any) {
    console.error("Get leaderboard error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
