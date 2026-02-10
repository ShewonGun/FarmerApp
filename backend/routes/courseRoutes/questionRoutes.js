import express from "express";
import {
    addQuestion,
    getQuestionsByQuiz,
    updateQuestion,
    deleteQuestion
} from "../../controllers/courseControllers/questionController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Question routes - Admin only for create, update, delete
router.post("/quiz/:quizId/question", authenticate, adminOnly, addQuestion);
router.get("/quiz/:quizId/questions", authenticate, getQuestionsByQuiz);
router.put("/question/:id", authenticate, adminOnly, updateQuestion);
router.delete("/question/:id", authenticate, adminOnly, deleteQuestion);

export default router;
