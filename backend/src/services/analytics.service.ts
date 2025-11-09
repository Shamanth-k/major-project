import Analytics from "../models/Analytics.js";
import Assessment from "../models/Assessment.js";
import GameProgress from "../models/GameProgress.js";
import { GameType } from "../models/User.js";
import geminiService from "./gemini.service.js";

export class AnalyticsService {
  /**
   * Store pre-assessment analytics data (partial analytics before post-assessment)
   */
  async storePreAssessmentAnalytics(
    userId: string,
    gameType: GameType,
    level: number
  ): Promise<any> {
    try {
      // Get pre-assessment
      const preAssessment = await Assessment.findOne({
        userId,
        gameType,
        level,
        assessmentType: "pre",
      });

      if (!preAssessment) {
        throw new Error("Pre-assessment not found");
      }

      // Get game progress
      const gameProgress = await GameProgress.findOne({ userId, gameType });

      // Identify areas from pre-assessment
      const weakAreas = this.identifyWeakAreas(preAssessment.questions);
      const strengthAreas = this.identifyStrengthAreas(preAssessment.questions);

      // Calculate success rate
      const successRate = gameProgress
        ? (gameProgress.completedLevels.length / gameProgress.currentLevel) *
          100
        : 0;

      // Update or create analytics with pre-assessment data only
      const analytics = await Analytics.findOneAndUpdate(
        { userId, gameType, level },
        {
          preAssessmentScore: preAssessment.score,
          postAssessmentScore: 0, // Will be updated later
          improvementPercentage: 0, // Will be calculated later
          attempts: (gameProgress?.completedLevels.length || 0) + 1,
          successRate: Math.round(successRate * 100) / 100,
          averageTimePerLevel: gameProgress?.timeSpent || 0,
          skillsImproved: [],
          weakAreas,
          strengthAreas,
          totalPlayTime: gameProgress?.timeSpent || 0,
          badgesEarned: [],
          aiGeneratedInsights:
            "Pre-assessment completed. Complete post-assessment for full insights.",
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(
        `Pre-assessment analytics stored for ${gameType} level ${level}`
      );
      return analytics;
    } catch (error) {
      console.error("Error storing pre-assessment analytics:", error);
      throw error;
    }
  }

  /**
   * Calculate and update analytics after completing a post-assessment
   */
  async updateAnalytics(
    userId: string,
    gameType: GameType,
    level: number
  ): Promise<any> {
    try {
      // Get pre and post assessments
      const preAssessment = await Assessment.findOne({
        userId,
        gameType,
        level,
        assessmentType: "pre",
      });

      const postAssessment = await Assessment.findOne({
        userId,
        gameType,
        level,
        assessmentType: "post",
      });

      if (!preAssessment || !postAssessment) {
        throw new Error(
          "Both pre and post assessments are required for analytics"
        );
      }

      // Get game progress
      const gameProgress = await GameProgress.findOne({ userId, gameType });

      // Calculate metrics
      const preScore = preAssessment.score;
      const postScore = postAssessment.score;
      const improvement = postScore - preScore;
      const improvementPercentage =
        preScore > 0 ? (improvement / preScore) * 100 : postScore > 0 ? 100 : 0;

      // Identify weak and strong areas based on question performance
      const weakAreas = this.identifyWeakAreas(postAssessment.questions);
      const strengthAreas = this.identifyStrengthAreas(
        postAssessment.questions
      );
      const skillsImproved = this.identifyImprovedSkills(
        preAssessment.questions,
        postAssessment.questions
      );

      // Calculate success rate
      const successRate = gameProgress
        ? (gameProgress.completedLevels.length / gameProgress.currentLevel) *
          100
        : 0;

      // Generate AI insights
      const aiInsights = await geminiService.generateAnalyticsInsights(
        gameType,
        preScore,
        postScore,
        weakAreas,
        strengthAreas
      );

      // Determine badges earned
      const badgesEarned = this.calculateBadges(
        improvement,
        postScore,
        gameProgress?.completedLevels.length || 0
      );

      // Update or create analytics
      const analytics = await Analytics.findOneAndUpdate(
        { userId, gameType, level },
        {
          preAssessmentScore: preScore,
          postAssessmentScore: postScore,
          improvementPercentage: Math.round(improvementPercentage * 100) / 100,
          attempts: (gameProgress?.completedLevels.length || 0) + 1,
          successRate: Math.round(successRate * 100) / 100,
          averageTimePerLevel: gameProgress?.timeSpent || 0,
          skillsImproved,
          weakAreas,
          strengthAreas,
          completionDate: new Date(),
          totalPlayTime: gameProgress?.timeSpent || 0,
          badgesEarned,
          aiGeneratedInsights: aiInsights,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      return analytics;
    } catch (error) {
      console.error("Error updating analytics:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics for a user
   */
  async getUserAnalytics(userId: string): Promise<any> {
    try {
      const analytics = await Analytics.find({ userId }).sort({
        lastUpdated: -1,
      });
      const gameProgress = await GameProgress.find({ userId });
      const assessments = await Assessment.find({ userId }).sort({
        completedAt: -1,
      });

      // Calculate overall statistics
      const totalGamesPlayed = gameProgress.length;
      const totalLevelsCompleted = gameProgress.reduce(
        (sum, progress) => sum + progress.completedLevels.length,
        0
      );
      const totalPlayTime = gameProgress.reduce(
        (sum, progress) => sum + progress.timeSpent,
        0
      );

      // Calculate average improvement across all games
      const avgImprovement =
        analytics.length > 0
          ? analytics.reduce((sum, a) => sum + a.improvementPercentage, 0) /
            analytics.length
          : 0;

      // Get all unique badges
      const allBadges = [...new Set(analytics.flatMap((a) => a.badgesEarned))];

      return {
        overview: {
          totalGamesPlayed,
          totalLevelsCompleted,
          totalPlayTime,
          averageImprovement: Math.round(avgImprovement * 100) / 100,
          totalBadges: allBadges.length,
          badges: allBadges,
        },
        gameAnalytics: analytics,
        recentAssessments: assessments.slice(0, 10),
        progressByGame: gameProgress,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific game
   */
  async getGameAnalytics(userId: string, gameType: GameType): Promise<any> {
    try {
      const analytics = await Analytics.find({ userId, gameType }).sort({
        level: 1,
      });
      const gameProgress = await GameProgress.findOne({ userId, gameType });
      const assessments = await Assessment.find({ userId, gameType }).sort({
        completedAt: -1,
      });

      return {
        analytics,
        progress: gameProgress,
        assessments,
      };
    } catch (error) {
      console.error("Error getting game analytics:", error);
      throw error;
    }
  }

  /**
   * Identify weak areas from assessment questions
   */
  private identifyWeakAreas(questions: any[]): string[] {
    const incorrectQuestions = questions.filter((q) => !q.isCorrect);

    // Extract topics from incorrect questions (simplified)
    const topics = incorrectQuestions.map((q) => {
      const question = q.question.toLowerCase();
      if (question.includes("phishing") || question.includes("email"))
        return "Email Security";
      if (question.includes("password")) return "Password Security";
      if (question.includes("malware") || question.includes("virus"))
        return "Malware Detection";
      if (question.includes("law") || question.includes("legal"))
        return "Legal Knowledge";
      if (question.includes("policy") || question.includes("regulation"))
        return "Policy Understanding";
      return "General Concepts";
    });

    return [...new Set(topics)];
  }

  /**
   * Identify strength areas from assessment questions
   */
  private identifyStrengthAreas(questions: any[]): string[] {
    const correctQuestions = questions.filter((q) => q.isCorrect);

    const topics = correctQuestions.map((q) => {
      const question = q.question.toLowerCase();
      if (question.includes("phishing") || question.includes("email"))
        return "Email Security";
      if (question.includes("password")) return "Password Security";
      if (question.includes("malware") || question.includes("virus"))
        return "Malware Detection";
      if (question.includes("law") || question.includes("legal"))
        return "Legal Knowledge";
      if (question.includes("policy") || question.includes("regulation"))
        return "Policy Understanding";
      return "General Concepts";
    });

    return [...new Set(topics)];
  }

  /**
   * Identify skills that improved between pre and post assessment
   */
  private identifyImprovedSkills(
    preQuestions: any[],
    postQuestions: any[]
  ): string[] {
    const improved: string[] = [];

    // Compare similar questions if they exist
    if (preQuestions.length === postQuestions.length) {
      for (let i = 0; i < preQuestions.length; i++) {
        if (!preQuestions[i].isCorrect && postQuestions[i].isCorrect) {
          improved.push(`Question ${i + 1} mastery`);
        }
      }
    }

    // If overall score improved, add general improvement
    const preCorrect = preQuestions.filter((q) => q.isCorrect).length;
    const postCorrect = postQuestions.filter((q) => q.isCorrect).length;

    if (postCorrect > preCorrect) {
      improved.push("Overall Understanding");
    }

    return improved.length > 0 ? improved : ["Continued Learning"];
  }

  /**
   * Calculate badges based on performance
   */
  private calculateBadges(
    improvement: number,
    postScore: number,
    levelsCompleted: number
  ): string[] {
    const badges: string[] = [];

    if (improvement >= 30) badges.push("Quick Learner");
    if (improvement >= 50) badges.push("Outstanding Improvement");
    if (postScore >= 90) badges.push("Near Perfect");
    if (postScore === 100) badges.push("Perfect Score");
    if (levelsCompleted >= 5) badges.push("Dedicated Player");
    if (levelsCompleted >= 10) badges.push("Game Master");

    return badges;
  }

  /**
   * Get admin analytics - system-wide statistics
   */
  async getAdminAnalytics(): Promise<any> {
    try {
      const totalUsers = await Analytics.distinct("userId");
      const allAnalytics = await Analytics.find();
      const allProgress = await GameProgress.find();

      // Calculate system-wide metrics
      const avgImprovement =
        allAnalytics.length > 0
          ? allAnalytics.reduce((sum, a) => sum + a.improvementPercentage, 0) /
            allAnalytics.length
          : 0;

      const totalPlayTime = allProgress.reduce(
        (sum, p) => sum + p.timeSpent,
        0
      );

      // Game popularity
      const gameStats: Record<string, number> = {};
      allProgress.forEach((p) => {
        gameStats[p.gameType] = (gameStats[p.gameType] || 0) + 1;
      });

      return {
        totalUsers: totalUsers.length,
        totalGamesPlayed: allProgress.length,
        averageImprovement: Math.round(avgImprovement * 100) / 100,
        totalPlayTime,
        gamePopularity: gameStats,
        recentActivity: allAnalytics.slice(0, 20),
      };
    } catch (error) {
      console.error("Error getting admin analytics:", error);
      throw error;
    }
  }
}

export default new AnalyticsService();
