import express from "express";
import {
    submitQuizAttempt,
    getUserQuizAttempts,
    getQuizAttemptById,
    getUserCourseQuizAttempts
} from "../../controllers/courseControllers/progressController.js";

const router = express.Router();

// Progress routes
router.post("/:userId/quiz/:quizId/attempt", submitQuizAttempt);
router.get("/:userId/quiz/:quizId/attempts", getUserQuizAttempts);
router.get("/progress/:attemptId", getQuizAttemptById);
router.get("/:userId/course/:courseId/progress", getUserCourseQuizAttempts);

export default router;