import express from "express";
import { getQuizExplanations } from "../../controllers/courseControllers/aiCourseController.js";
import { authenticate } from "../../middlewares/protect.js";

const router = express.Router();

// AI-powered quiz explanation route
router.get("/progress/:attemptId/ai-explanations", authenticate, getQuizExplanations);

export default router;