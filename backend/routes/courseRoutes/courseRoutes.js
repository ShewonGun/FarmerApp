import express from "express";
import {
    addCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    enrollUserInCourse,
    getUserEnrollments,
    checkEnrollment,
    markLessonCompleted,
    markCourseAsCompleted
} from "../../controllers/courseControllers/courseController.js";

const router = express.Router();

// Course routes
router.post("/addCourse", addCourse);
router.get("/course", getAllCourses);
router.get("/course/:id", getCourseById);
router.put("/course/:id", updateCourse);
router.delete("/course/:id", deleteCourse);

// Enrollment routes
router.post("/:userId/course/:courseId/enroll", enrollUserInCourse);
router.get("/:userId/enrollments", getUserEnrollments);
router.get("/:userId/course/:courseId/check-enrollment", checkEnrollment);
router.put("/:userId/course/:courseId/lesson/:lessonId/complete", markLessonCompleted);
router.put("/:userId/course/:courseId/complete", markCourseAsCompleted);

export default router;