import mongoose, { Schema, Document } from "mongoose";
import { GameType } from "./User.js";

export interface IGameProgress extends Document {
  userId: mongoose.Types.ObjectId;
  gameType: GameType;
  level: number;
  completedLevels: number[];
  currentLevel: number;
  totalScore: number;
  timeSpent: number; // in seconds
  lastPlayed: Date;
  gameSpecificData: Map<string, any>; // For game-specific metrics
}

const GameProgressSchema: Schema = new Schema(
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
      default: 1,
    },
    completedLevels: [
      {
        type: Number,
      },
    ],
    currentLevel: {
      type: Number,
      default: 1,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    lastPlayed: {
      type: Date,
      default: Date.now,
    },
    gameSpecificData: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
GameProgressSchema.index({ userId: 1, gameType: 1 }, { unique: true });

export default mongoose.model<IGameProgress>(
  "GameProgress",
  GameProgressSchema
);
