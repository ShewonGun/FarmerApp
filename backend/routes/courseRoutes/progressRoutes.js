import express from "express";
import {
    submitQuizAttempt,
    getUserQuizAttempts,
    getQuizAttemptById,
    getUserCourseQuizAttempts
} from "../../controllers/courseControllers/progressController.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Progress routes 
router.post("/:userId/quiz/:quizId/attempt", authenticate, isSelfOrAdmin, submitQuizAttempt);
router.get("/:userId/quiz/:quizId/attempts", authenticate, isSelfOrAdmin, getUserQuizAttempts);
router.get("/attempt/:attemptId", authenticate, getQuizAttemptById);
router.get("/:userId/course/:courseId", authenticate, isSelfOrAdmin, getUserCourseQuizAttempts);

export default router;