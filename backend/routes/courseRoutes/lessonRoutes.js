import express from "express";
import {
    addLesson,
    getLessonsByCourse,
    getLessonById,
    updateLesson,
    deleteLesson,
    //testYoutubeThumbnail
} from "../../controllers/courseControllers/lessonController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Lesson routes 
router.get("/course/:courseId", authenticate, getLessonsByCourse);
router.post("/course/:courseId", authenticate, adminOnly, addLesson);
router.get("/:id", authenticate, getLessonById);
router.put("/:id", authenticate, adminOnly, updateLesson);
router.delete("/:id", authenticate, adminOnly, deleteLesson);

export default router;


