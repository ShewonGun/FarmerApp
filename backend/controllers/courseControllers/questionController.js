import Question from "../../models/course/Question.js";
import Quiz from "../../models/course/Quiz.js";
import mongoose from "mongoose";

// Add a question to a quiz
export const addQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionText, choices, order } = req.body;
        
        // Validate quizId
        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ success: false, message: "Invalid quiz ID" });
        }
        
        // Validate required fields
        if (!questionText) {
            return res.status(400).json({ success: false, message: "questionText is required" });
        }
        
        if (!choices || !Array.isArray(choices) || choices.length < 2) {
            return res.status(400).json({ success: false, message: "At least 2 choices are required" });
        }
        
        // Validate all choices have choiceText
        for (let i = 0; i < choices.length; i++) {
            if (!choices[i].choiceText) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Choice ${i + 1}: choiceText is required` 
                });
            }
        }
        
        // Check if at least one choice is correct
        const hasCorrectAnswer = choices.some(choice => choice.isCorrect === true);
        if (!hasCorrectAnswer) {
            return res.status(400).json({ success: false, message: "At least one choice must be marked as correct" });
        }
        
        // Check if quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // Get the next order number if not provided
        let questionOrder = order;
        if (!questionOrder) {
            const lastQuestion = await Question.findOne({ quiz: quizId }).sort({ order: -1 });
            questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
        }
        
        // Format choices with order
        const formattedChoices = choices.map((choice, index) => ({
            choiceText: choice.choiceText,
            isCorrect: choice.isCorrect || false,
            order: choice.order || index + 1
        }));
        
        // Create question with embedded choices
        const question = new Question({
            quiz: quizId,
            questionText,
            choices: formattedChoices,
            order: questionOrder
        });
        await question.save();
        
        res.status(201).json({
            success: true,
            question
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all questions for a quiz
export const getQuestionsByQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Validate quizId
        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ success: false, message: "Invalid quiz ID" });
        }
        
        // Check if quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // Find all questions for this quiz (choices are already embedded)
        const questions = await Question.find({ quiz: quizId }).sort({ order: 1 });
        
        res.status(200).json({
            success: true,
            count: questions.length,
            questions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a question
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { questionText, choices, order } = req.body;
        
        // Validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid question ID" });
        }
        
        // Find question
        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }
        
        // Update question text if provided
        if (questionText) {
            question.questionText = questionText;
        }
        
        // Update order if provided
        if (order !== undefined) {
            question.order = order;
        }
        
        // Update choices if provided
        if (choices && Array.isArray(choices)) {
            if (choices.length < 2) {
                return res.status(400).json({ success: false, message: "At least 2 choices are required" });
            }
            
            // Validate all choices have choiceText
            for (let i = 0; i < choices.length; i++) {
                if (!choices[i].choiceText) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Choice ${i + 1}: choiceText is required` 
                    });
                }
            }
            
            // Check if at least one choice is correct
            const hasCorrectAnswer = choices.some(choice => choice.isCorrect === true);
            if (!hasCorrectAnswer) {
                return res.status(400).json({ success: false, message: "At least one choice must be marked as correct" });
            }
            
            // Format choices with order
            const formattedChoices = choices.map((choice, index) => ({
                choiceText: choice.choiceText,
                isCorrect: choice.isCorrect || false,
                order: choice.order || index + 1
            }));
            
            question.choices = formattedChoices;
        }
        
        await question.save();
        
        res.status(200).json({
            success: true,
            message: "Question updated successfully",
            question
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid question ID" });
        }
        
        // Find and delete the question (embedded choices are automatically deleted)
        const question = await Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }
        
        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
