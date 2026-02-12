import Progress from "../../models/course/Progress.js";
import Quiz from "../../models/course/Quiz.js";
import Question from "../../models/course/Question.js";
import Lesson from "../../models/course/Lesson.js";
import Enroll from "../../models/course/Enroll.js";
import Course from "../../models/course/Course.js";
import mongoose from "mongoose";

// Helper function to check and auto-complete course
const checkAndCompleteCourse = async (enrollment, courseId, userId) => {
    try {
        // Skip if already completed
        if (enrollment.completedAt) {
            return;
        }

        // Get all lessons for the course
        const allLessons = await Lesson.find({ course: courseId });
        const totalLessons = allLessons.length;

        // Get all quizzes for the course
        const lessonIds = allLessons.map(lesson => lesson._id);
        const allQuizzes = await Quiz.find({ lesson: { $in: lessonIds } });
        const totalQuizzes = allQuizzes.length;

        // Check if all lessons are completed
        const completedLessonsCount = enrollment.completedLessons.length;
        if (completedLessonsCount < totalLessons) {
            return; // Not all lessons completed
        }

        // Check if all quizzes are completed (if there are quizzes)
        const completedQuizzesCount = enrollment.completedQuizzes.length;
        if (totalQuizzes > 0 && completedQuizzesCount < totalQuizzes) {
            return; // Not all quizzes passed
        }

        // All lessons and quizzes completed - auto-complete the course
        const allQuizIds = allQuizzes.map(quiz => quiz._id);
        const quizAttempts = await Progress.find({
            user: userId,
            course: courseId,
            quiz: { $in: allQuizIds },
            passed: true
        }).sort({ attemptedAt: -1 });

        // Calculate average score
        let totalScore = 0;
        const quizScores = new Map();

        for (const attempt of quizAttempts) {
            const quizId = attempt.quiz.toString();
            if (!quizScores.has(quizId)) {
                quizScores.set(quizId, attempt.percentage);
                totalScore += attempt.percentage;
            }
        }

        const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 100;

        // Mark course as completed
        enrollment.completedAt = new Date();
        enrollment.averageScore = averageScore;
        enrollment.progress = 100;

        await enrollment.save();

        console.log(`Course ${courseId} auto-completed for user ${userId}`);
    } catch (error) {
        console.error("Error in checkAndCompleteCourse:", error.message);
    }
};

// Submit quiz attempt
export const submitQuizAttempt = async (req, res) => {
    try {
        const { userId, quizId } = req.params;
        const { answers } = req.body; // answers: [{ questionId, selectedChoiceId }]
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ success: false, message: "Invalid user or quiz ID" });
        }
        
        // Validate answers array
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: "Answers array is required" });
        }
        
        // Find the quiz
        const quiz = await Quiz.findById(quizId).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // Find all questions for this quiz
        const questions = await Question.find({ quiz: quizId });
        if (questions.length === 0) {
            return res.status(400).json({ success: false, message: "Quiz has no questions" });
        }
        
        // Process answers and calculate score
        const processedAnswers = [];
        let correctCount = 0;
        
        for (const answer of answers) {
            const question = questions.find(q => q._id.toString() === answer.questionId);
            if (!question) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${answer.questionId} not found in this quiz` 
                });
            }
            
            const selectedChoice = question.choices.id(answer.selectedChoiceId);
            if (!selectedChoice) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Choice ${answer.selectedChoiceId} not found in question ${answer.questionId}` 
                });
            }
            
            const isCorrect = selectedChoice.isCorrect;
            if (isCorrect) {
                correctCount++;
            }
            
            processedAnswers.push({
                question: answer.questionId,
                selectedChoice: answer.selectedChoiceId,
                isCorrect
            });
        }
        
        // Calculate percentage
        const totalQuestions = questions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = percentage >= quiz.passingScore;
        
        // Get course ID from lesson
        const lesson = await Lesson.findById(quiz.lesson);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        
        // Create progress record
        const progress = new Progress({
            user: userId,
            quiz: quizId,
            course: lesson.course,
            answers: processedAnswers,
            score: correctCount,
            totalQuestions,
            percentage,
            passed
        });
        
        await progress.save();
        
        // If quiz is passed, add to enrollment's completedQuizzes and check course completion
        let courseCompleted = false;
        if (passed) {
            const enrollment = await Enroll.findOne({ user: userId, course: lesson.course });
            if (enrollment && !enrollment.completedQuizzes.includes(quizId)) {
                enrollment.completedQuizzes.push(quizId);
                await enrollment.save();

                // Check if course should be auto-completed
                await checkAndCompleteCourse(enrollment, lesson.course, userId);
                courseCompleted = !!enrollment.completedAt;
            }
        }
        
        res.status(201).json({
            success: true,
            message: courseCompleted 
                ? "Quiz passed! Course completed! You can now generate your certificate." 
                : passed 
                    ? "Quiz passed!" 
                    : "Quiz not passed. Try again!",
            results: {
                correctAnswers: correctCount,
                totalQuestions,
                percentage,
                passed,
                passingScore: quiz.passingScore
            },
            progress: {
                _id: progress._id,
                attemptedAt: progress.attemptedAt
            },
            courseCompleted,
            answerBreakdown: processedAnswers.map(ans => ({
                questionId: ans.question,
                isCorrect: ans.isCorrect
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's quiz attempts for a specific quiz
export const getUserQuizAttempts = async (req, res) => {
    try {
        const { userId, quizId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ success: false, message: "Invalid user or quiz ID" });
        }
        
        const attempts = await Progress.find({ user: userId, quiz: quizId })
            .sort({ attemptedAt: -1 })
            .select('-answers'); // Exclude detailed answers for overview
        
        res.status(200).json({
            success: true,
            count: attempts.length,
            attempts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a specific quiz attempt with detailed answers
export const getQuizAttemptById = async (req, res) => {
    try {
        const { attemptId } = req.params;
        
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({ success: false, message: "Invalid attempt ID" });
        }
        
        const attempt = await Progress.findById(attemptId)
            .populate('quiz', 'title passingScore')
            .populate('answers.question', 'questionText choices');
        
        if (!attempt) {
            return res.status(404).json({ success: false, message: "Progress record not found" });
        }
        
        res.status(200).json({
            success: true,
            attempt
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all quiz attempts for a user in a course
export const getUserCourseQuizAttempts = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        const attempts = await Progress.find({ user: userId, course: courseId })
            .populate('quiz', 'title passingScore')
            .sort({ attemptedAt: -1 })
            .select('-answers');
        
        res.status(200).json({
            success: true,
            count: attempts.length,
            attempts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
