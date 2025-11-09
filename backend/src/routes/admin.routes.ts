import express from "express";
import {
  getSystemAnalytics,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllGameProgress,
  getAllAssessments,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard stats
router.get("/dashboard", getDashboardStats);

// System analytics
router.get("/analytics", getSystemAnalytics);

// User management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

// Game progress (all users)
router.get("/progress", getAllGameProgress);

// Assessments (all users)
router.get("/assessments", getAllAssessments);

export default router;
