import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/", authenticate, getLeaderboard);

export default router;
