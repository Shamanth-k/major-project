import mongoose, { Schema, Document } from "mongoose";
import { GameType } from "./User.js";

export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  gameType: GameType;
  level: number;

  // Assessment Comparison
  preAssessmentScore: number;
  postAssessmentScore: number;
  improvementPercentage: number;

  // Game Performance
  attempts: number;
  successRate: number;
  averageTimePerLevel: number;

  // Detailed Metrics
  skillsImproved: string[];
  weakAreas: string[];
  strengthAreas: string[];

  // Progress Tracking
  completionDate?: Date;
  totalPlayTime: number;

  // Badges Earned
  badgesEarned: string[];

  // Generated Insights
  aiGeneratedInsights?: string;

  lastUpdated: Date;
}

const AnalyticsSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameType: {
      type: String,
      enum: ["phishing", "loophole", "judge", "architect", "veo", "laws"],
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    preAssessmentScore: {
      type: Number,
      default: 0,
    },
    postAssessmentScore: {
      type: Number,
      default: 0,
    },
    improvementPercentage: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
    averageTimePerLevel: {
      type: Number,
      default: 0,
    },
    skillsImproved: [
      {
        type: String,
      },
    ],
    weakAreas: [
      {
        type: String,
      },
    ],
    strengthAreas: [
      {
        type: String,
      },
    ],
    completionDate: {
      type: Date,
    },
    totalPlayTime: {
      type: Number,
      default: 0,
    },
    badgesEarned: [
      {
        type: String,
      },
    ],
    aiGeneratedInsights: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
AnalyticsSchema.index({ userId: 1, gameType: 1, level: 1 }, { unique: true });

export default mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
