import express from "express";
import {
  generateAssessment,
  submitAssessment,
  getAssessment,
  getGameAssessments,
  getAllAssessments,
  deleteAssessment,
  generateAssessmentValidation,
  submitAssessmentValidation,
} from "../controllers/assessment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/errorHandler.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Generate new assessment
router.post(
  "/generate",
  generateAssessmentValidation,
  validate,
  generateAssessment
);

// Submit assessment answers
router.post("/submit", submitAssessmentValidation, validate, submitAssessment);

// Get all assessments for user
router.get("/", getAllAssessments);

// Get specific assessment
router.get("/:assessmentId", getAssessment);

// Get assessments for specific game and level
router.get("/:gameType/:level", getGameAssessments);

// Delete assessment
router.delete("/:assessmentId", deleteAssessment);

export default router;
