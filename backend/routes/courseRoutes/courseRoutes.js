import express from "express";
import {
    addCourse,
    getAllCourses,
    getAllCoursesWithDetails,
    getCourseById,
    updateCourse,
    deleteCourse,
    enrollUserInCourse,
    getUserEnrollments,
    checkEnrollment,
    markLessonCompleted,
    markCourseAsCompleted
} from "../../controllers/courseControllers/courseController.js";
import { authenticate, adminOnly, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Course routes - Admin only for create, update, delete
router.post("/addCourse", authenticate, adminOnly, addCourse);
router.get("/course", getAllCourses);
router.get("/courseWithDetails", getAllCoursesWithDetails);
router.get("/course/:id", authenticate, getCourseById);
router.put("/course/:id", authenticate, adminOnly, updateCourse);
router.delete("/course/:id", authenticate, adminOnly, deleteCourse);

// Enrollment routes - User can access their own, admin can access any
router.post("/:userId/course/:courseId/enroll", authenticate, isSelfOrAdmin, enrollUserInCourse);
router.get("/:userId/enrollments", authenticate, isSelfOrAdmin, getUserEnrollments);
router.get("/:userId/course/:courseId/check-enrollment", authenticate, isSelfOrAdmin, checkEnrollment);
router.put("/:userId/course/:courseId/lesson/:lessonId/complete", authenticate, isSelfOrAdmin, markLessonCompleted);
router.put("/:userId/course/:courseId/complete", authenticate, isSelfOrAdmin, markCourseAsCompleted);

export default router;