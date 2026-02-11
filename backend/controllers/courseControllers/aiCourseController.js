import Progress from "../../models/course/Progress.js";
import Question from "../../models/course/Question.js";
import mongoose from "mongoose";
import githubAI from "../../config/githubAI.js";

// Helper function to generate AI explanation for wrong answers
const generateAIExplanation = async (question, selectedChoice, correctChoice, model = "gpt-4o-mini") => {
    try {
        const prompt = `A student answered a farming quiz question incorrectly. Please explain why their answer is wrong and provide a clear explanation of the correct answer.

Question: ${question.questionText}

Student's Answer: ${selectedChoice.choiceText}
Correct Answer: ${correctChoice.choiceText}

Please provide:
1. Why the student's answer is incorrect
2. A clear explanation of why the correct answer is right
3. Keep it concise and educational (2-3 sentences)`;

        const response = await githubAI.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful farming education assistant providing clear, concise explanations for quiz answers." },
                { role: "user", content: prompt }
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 300,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("AI Explanation Error:", error.message);
        return "Unable to generate explanation at this time.";
    }
};

// Generate AI explanations for quiz attempt
export const getQuizExplanations = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { model } = req.query; // Optional: allow custom model selection
        
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({ success: false, message: "Invalid attempt ID" });
        }
        
        // Find the progress record
        const attempt = await Progress.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ success: false, message: "Quiz attempt not found" });
        }
        
        // Get all questions for this quiz
        const questions = await Question.find({ quiz: attempt.quiz });
        
        // Generate explanations for wrong answers
        const explanations = [];
        
        for (const answer of attempt.answers) {
            if (!answer.isCorrect) {
                // Find the question
                const question = questions.find(q => q._id.toString() === answer.question.toString());
                if (!question) continue;
                
                // Find selected and correct choices
                const selectedChoice = question.choices.id(answer.selectedChoice);
                const correctChoice = question.choices.find(c => c.isCorrect);
                
                if (selectedChoice && correctChoice) {
                    // Generate AI explanation
                    const aiExplanation = await generateAIExplanation(
                        question,
                        selectedChoice,
                        correctChoice,
                        model
                    );
                    
                    explanations.push({
                        questionId: question._id,
                        questionText: question.questionText,
                        selectedChoice: {
                            id: selectedChoice._id,
                            text: selectedChoice.choiceText
                        },
                        correctChoice: {
                            id: correctChoice._id,
                            text: correctChoice.choiceText
                        },
                        aiExplanation
                    });
                }
            }
        }
        
        res.status(200).json({
            success: true,
            attemptId: attempt._id,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            passed: attempt.passed,
            modelUsed: model || "gpt-4o-mini",
            explanations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};