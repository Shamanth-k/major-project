import { Response } from "express";
import { body } from "express-validator";
import Assessment from "../models/Assessment.js";
import { AuthRequest } from "../middleware/auth.js";
import { GameType } from "../models/User.js";
import geminiService from "../services/gemini.service.js";
import analyticsService from "../services/analytics.service.js";

/**
 * Generate a new assessment (pre or post) — online-only
 */
export const generateAssessment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType, level, assessmentType, forceRegenerate } = req.body as {
      gameType: GameType;
      level: number;
      assessmentType: "pre" | "post";
      forceRegenerate?: boolean;
    };

    // Check if there's an existing assessment for this user/game/level/type
    const existing = await Assessment.findOne({
      userId: req.userId,
      gameType,
      level,
      assessmentType,
    });

    if (existing) {
      const isSubmitted = existing.questions.some(
        (q: any) => q.userAnswer !== undefined
      );

      if (!isSubmitted && !forceRegenerate) {
        // Return existing unsubmitted assessment to avoid unnecessary API calls
        console.log("Returning cached assessment to save API quota");
        const publicAssessment = {
          _id: existing._id,
          gameType: existing.gameType,
          level: existing.level,
          assessmentType: existing.assessmentType,
          questions: existing.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
          })),
          totalQuestions: existing.totalQuestions,
        };
        res.status(200).json({ assessment: publicAssessment });
        return;
      } else {
        // If submitted or force regenerate requested, delete it
        console.log(
          forceRegenerate
            ? "Force regenerating assessment"
            : "Deleting submitted assessment to allow retake"
        );
        await Assessment.deleteOne({ _id: existing._id });
      }
    } // Generate fresh questions ONLINE using Gemini (throws if API key missing)
    const questions = await geminiService.generateAssessment(
      gameType,
      Number(level),
      assessmentType,
      5
    );

    // Create assessment (no answers yet). Do NOT set completedAt here.
    const assessment = new Assessment({
      userId: req.userId,
      gameType,
      level: Number(level),
      assessmentType,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        userAnswer: undefined,
        isCorrect: undefined,
      })),
      score: 0,
      totalQuestions: questions.length,
      correctAnswers: 0,
      timeSpent: 0,
      // Suggest adding createdAt in your schema with timestamps
    });

    await assessment.save();

    // Never leak correct answers to client
    const publicAssessment = {
      _id: assessment._id,
      gameType: assessment.gameType,
      level: assessment.level,
      assessmentType: assessment.assessmentType,
      questions: assessment.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
      })),
      totalQuestions: assessment.totalQuestions,
    };

    res.status(201).json({ assessment: publicAssessment });
  } catch (error: any) {
    console.error("Generate assessment error:", error?.message || error);
    // Distinguish missing API key / online failure
    const msg =
      error?.message?.includes("GEMINI_API_KEY") ||
      error?.message?.toLowerCase?.().includes("gemini")
        ? "Online question generation failed. Check Gemini API configuration."
        : "Error generating assessment";
    res.status(503).json({ error: msg });
  }
};

/**
 * Submit assessment answers
 */
export const submitAssessment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { assessmentId, answers, timeSpent } = req.body as {
      assessmentId: string;
      answers: number[];
      timeSpent?: number;
    };

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId: req.userId,
    });

    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    // Prevent re-submission
    const alreadySubmitted = assessment.questions.every(
      (q: any) => q.userAnswer !== undefined
    );
    if (alreadySubmitted) {
      res.status(400).json({ error: "Assessment already submitted" });
      return;
    }

    // Basic validation: answers length must match totalQuestions
    if (
      !Array.isArray(answers) ||
      answers.length !== assessment.totalQuestions
    ) {
      res.status(400).json({
        error: `Answers must be an array of length ${assessment.totalQuestions}`,
      });
      return;
    }

    // Update questions with user answers and compute correctness
    let correctCount = 0;
    assessment.questions.forEach((q: any, index: number) => {
      const ans = answers[index];
      // Validate each answer is an integer 0..3 (or allow undefined to skip)
      if (ans !== undefined && ans !== null) {
        if (typeof ans !== "number" || ans < 0 || ans > 3) {
          return; // ignore invalid; alternatively reject the request
        }
        q.userAnswer = ans;
        q.isCorrect = ans === q.correctAnswerIndex;
        if (q.isCorrect) correctCount++;
      }
    });

    // Calculate final score
    assessment.correctAnswers = correctCount;
    assessment.score = Math.round(
      (correctCount / assessment.totalQuestions) * 100
    );
    assessment.timeSpent = Math.max(0, Number(timeSpent) || 0);
    assessment.completedAt = new Date();

    await assessment.save();

    // Fire-and-forget analytics (errors shouldn't block submit)
    if (assessment.assessmentType === "pre") {
      analyticsService
        .storePreAssessmentAnalytics(
          req.userId!,
          assessment.gameType as GameType,
          assessment.level
        )
        .catch((e: any) =>
          console.error("Error storing pre-assessment analytics:", e)
        );
    } else {
      analyticsService
        .updateAnalytics(
          req.userId!,
          assessment.gameType as GameType,
          assessment.level
        )
        .catch((e: any) => console.error("Error updating analytics:", e));
    }

    res.json({
      assessment: {
        _id: assessment._id,
        score: assessment.score,
        correctAnswers: assessment.correctAnswers,
        totalQuestions: assessment.totalQuestions,
        questions: assessment.questions, // includes correctAnswerIndex and userAnswer for review
        assessmentType: assessment.assessmentType,
      },
    });
  } catch (error) {
    console.error("Submit assessment error:", error);
    res.status(500).json({ error: "Error submitting assessment" });
  }
};

/**
 * Get assessment by ID
 */
export const getAssessment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId: req.userId,
    });

    if (!assessment) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    res.json({ assessment });
  } catch (error) {
    console.error("Get assessment error:", error);
    res.status(500).json({ error: "Error fetching assessment" });
  }
};

/**
 * Get assessments for a specific game and level
 */
export const getGameAssessments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { gameType, level } = req.params;

    const assessments = await Assessment.find({
      userId: req.userId,
      gameType: gameType as GameType,
      level: parseInt(level, 10),
    }).sort({ completedAt: -1 });

    res.json({ assessments });
  } catch (error) {
    console.error("Get game assessments error:", error);
    res.status(500).json({ error: "Error fetching assessments" });
  }
};

/**
 * Get all assessments for current user
 */
export const getAllAssessments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const assessments = await Assessment.find({ userId: req.userId }).sort({
      completedAt: -1,
    });

    res.json({ assessments });
  } catch (error) {
    console.error("Get all assessments error:", error);
    res.status(500).json({ error: "Error fetching assessments" });
  }
};

/**
 * Delete an assessment (for retaking)
 */
export const deleteAssessment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { assessmentId } = req.params;

    const result = await Assessment.findOneAndDelete({
      _id: assessmentId,
      userId: req.userId,
    });

    if (!result) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    res.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Delete assessment error:", error);
    res.status(500).json({ error: "Error deleting assessment" });
  }
};

/**
 * Validation rules
 */
export const generateAssessmentValidation = [
  body("gameType")
    .isIn(["phishing", "loophole", "judge", "architect", "veo", "laws"])
    .withMessage("Invalid game type"),
  body("level")
    .isInt({ min: 1 })
    .withMessage("Level must be a positive integer"),
  body("assessmentType")
    .isIn(["pre", "post"])
    .withMessage("Assessment type must be either pre or post"),
];

export const submitAssessmentValidation = [
  body("assessmentId").notEmpty().withMessage("Assessment ID is required"),
  body("answers").isArray().withMessage("Answers must be an array"),
  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Time spent must be non-negative"),
];
