import express from "express";
import {
    enrollUserInCourse,
    getUserEnrollments,
    checkEnrollment,
    markLessonCompleted,
    markCourseAsCompleted
} from "../../controllers/courseControllers/courseController.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Enrollment routes - User can access their own, admin can access any
router.post("/:userId/course/:courseId/enroll", authenticate, isSelfOrAdmin, enrollUserInCourse);
router.get("/:userId", authenticate, isSelfOrAdmin, getUserEnrollments);
router.get("/:userId/course/:courseId/check-enrollment", authenticate, isSelfOrAdmin, checkEnrollment);
router.put("/:userId/course/:courseId/lesson/:lessonId/complete", authenticate, isSelfOrAdmin, markLessonCompleted);
router.put("/:userId/course/:courseId/complete", authenticate, isSelfOrAdmin, markCourseAsCompleted);

export default router;
