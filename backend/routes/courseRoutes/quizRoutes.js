import { addQuiz, getQuizByLesson, updateQuiz, deleteQuiz } from "../../controllers/courseControllers/quizController.js";
import express from "express";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Quiz routes - Admin only for create, update, delete
router.post("/lessons/:lessonId/quiz", authenticate, adminOnly, addQuiz);
router.get("/lessons/:lessonId/quiz", authenticate, getQuizByLesson);
router.put("/quiz/:id", authenticate, adminOnly, updateQuiz);
router.delete("/quiz/:id", authenticate, adminOnly, deleteQuiz);

export default router;