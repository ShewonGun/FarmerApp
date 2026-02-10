import express from "express";
import {
    submitQuizAttempt,
    getUserQuizAttempts,
    getQuizAttemptById,
    getUserCourseQuizAttempts
} from "../../controllers/courseControllers/progressController.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Progress routes - User can access their own, admin can access any
router.post("/:userId/quiz/:quizId/attempt", authenticate, isSelfOrAdmin, submitQuizAttempt);
router.get("/:userId/quiz/:quizId/attempts", authenticate, isSelfOrAdmin, getUserQuizAttempts);
router.get("/progress/:attemptId", authenticate, getQuizAttemptById);
router.get("/:userId/course/:courseId/progress", authenticate, isSelfOrAdmin, getUserCourseQuizAttempts);

export default router;