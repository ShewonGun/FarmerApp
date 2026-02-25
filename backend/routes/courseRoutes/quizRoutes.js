import { addQuiz, getQuizByLesson, updateQuiz, deleteQuiz } from "../../controllers/courseControllers/quizController.js";
import express from "express";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Quiz routes 
router.post("/lessons/:lessonId", authenticate, adminOnly, addQuiz);
router.get("/lessons/:lessonId", authenticate, getQuizByLesson);
router.put("/:id", authenticate, adminOnly, updateQuiz);
router.delete("/:id", authenticate, adminOnly, deleteQuiz);

export default router;