import Quiz from "../../models/course/Quiz.js";
import Question from "../../models/course/Question.js";
import Lesson from "../../models/course/Lesson.js";
import mongoose from "mongoose";

// Add a new quiz to a lesson
export const addQuiz = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, passingScore } = req.body;
        
        // Validate lessonId
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID" });
        }
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }
        
        // Check if lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        
        // Create quiz
        const quiz = new Quiz({
            lesson: lessonId,
            title,
            passingScore: passingScore || 70
        });
        await quiz.save();
        
        // Update lesson to show quiz is available
        lesson.isQuizAvailable = true;
        await lesson.save();
        
        res.status(201).json({ 
            success: true, 
            quiz
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get quiz details for a lesson
export const getQuizByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        // Validate lessonId
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID" });
        }
        
        // Find quiz for the lesson
        const quiz = await Quiz.findOne({ lesson: lessonId });
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found for this lesson" });
        }
        
        // Find all questions for this quiz (choices are already embedded)
        const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
        
        res.status(200).json({
            success: true,
            quiz: {
                ...quiz.toObject(),
                questions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update quiz
export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, passingScore } = req.body;
        
        // Validate quizId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid quiz ID" });
        }
        
        // Find and update quiz
        const quiz = await Quiz.findByIdAndUpdate(
            id,
            { title, passingScore },
            { new: true, runValidators: true }
        );
        
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        res.status(200).json({
            success: true,
            message: "Quiz updated successfully",
            quiz
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate quizId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid quiz ID" });
        }
        
        // Find quiz
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // Delete all questions (embedded choices are automatically deleted)
        await Question.deleteMany({ quiz: id });
        
        // Delete the quiz
        await Quiz.findByIdAndDelete(id);
        
        // Update lesson isQuizAvailable to false
        const lesson = await Lesson.findById(quiz.lesson);
        if (lesson) {
            lesson.isQuizAvailable = false;
            await lesson.save();
        }
        
        res.status(200).json({
            success: true,
            message: "Quiz deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
