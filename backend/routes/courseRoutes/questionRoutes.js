import express from "express";
import {
    addQuestion,
    getQuestionsByQuiz,
    updateQuestion,
    deleteQuestion
} from "../../controllers/courseControllers/questionController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Question routes
router.post("/quiz/:quizId", authenticate, adminOnly, addQuestion);
router.get("/quiz/:quizId", authenticate, getQuestionsByQuiz);
router.put("/:id", authenticate, adminOnly, updateQuestion);
router.delete("/:id", authenticate, adminOnly, deleteQuestion);

export default router;
