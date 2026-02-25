import express from "express";
import {
    addCourse,
    getAllCourses,
    getAllCoursesWithDetails,
    getCourseById,
    updateCourse,
    deleteCourse
} from "../../controllers/courseControllers/courseController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Course routes - Admin only for create, update, delete
router.post("/", authenticate, adminOnly, addCourse);
router.get("/", getAllCourses);
router.get("/with-details", getAllCoursesWithDetails);
router.get("/:id", authenticate, getCourseById);
router.put("/:id", authenticate, adminOnly, updateCourse);
router.delete("/:id", authenticate, adminOnly, deleteCourse);

export default router;