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

// Test route
//router.post("/test/youtube-thumbnail", testYoutubeThumbnail);

// Lesson routes 
router.get("/course/:courseId/lessons", authenticate, getLessonsByCourse);
router.post("/course/:courseId/lessons", authenticate, adminOnly, addLesson);
router.get("/lessons/:id", authenticate, getLessonById);
router.put("/lessons/:id", authenticate, adminOnly, updateLesson);
router.delete("/lessons/:id", authenticate, adminOnly, deleteLesson);

export default router;


