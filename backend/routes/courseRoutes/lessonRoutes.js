import express from "express";
import {
    addLesson,
    getLessonsByCourse,
    getLessonById,
    updateLesson,
    deleteLesson
} from "../../controllers/courseControllers/lessonController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Lesson routes - Admin only for create, update, delete
router.get("/course/:courseId/lessons", authenticate, getLessonsByCourse);
router.post("/course/:courseId/lessons", authenticate, adminOnly, addLesson);
router.get("/lessons/:id", authenticate, getLessonById);
router.put("/lessons/:id", authenticate, adminOnly, updateLesson);
router.delete("/lessons/:id", authenticate, adminOnly, deleteLesson);

export default router;


