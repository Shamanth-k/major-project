import mongoose, { Schema, Document } from "mongoose";
import { GameType } from "./User.js";

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  gameType: GameType;
  level: number;
  assessmentType: "pre" | "post";
  questions: IQuestion[];
  score: number; // 0-100
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  timeSpent: number; // in seconds
}

const QuestionSchema: Schema = new Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswerIndex: {
    type: Number,
    required: true,
  },
  userAnswer: {
    type: Number,
  },
  isCorrect: {
    type: Boolean,
  },
});

const AssessmentSchema: Schema = new Schema(
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
    assessmentType: {
      type: String,
      enum: ["pre", "post"],
      required: true,
    },
    questions: [QuestionSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
AssessmentSchema.index({ userId: 1, gameType: 1, level: 1, assessmentType: 1 });

export default mongoose.model<IAssessment>("Assessment", AssessmentSchema);
