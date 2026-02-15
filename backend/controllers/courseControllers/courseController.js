import Course from "../../models/course/Course.js";
import Lesson from "../../models/course/Lesson.js";
import Quiz from "../../models/course/Quiz.js";
import Question from "../../models/course/Question.js";
import Enroll from "../../models/course/Enroll.js";
import Progress from "../../models/course/Progress.js";
import User from "../../models/user/CoreIdentity.js";
import mongoose from "mongoose";

// Add a new course
export const addCourse = async (req, res) => {
  try {
    const { title, description, thumbnailUrl, isPublished } = req.body;
    const course = new Course({
      title,
      description,
      thumbnailUrl,
      isPublished
    });
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const courses = await Course.find().skip(skip).limit(limit);
        const total = await Course.countDocuments();
        
        res.status(200).json({ 
            success: true, 
            courses, 
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalCourses: total,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a course by ID
export const updateCourse = async (req, res) => {
    try {
        const allowedUpdates = ['title', 'description', 'thumbnailUrl', 'isPublished'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a course by ID
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        
        // Get all lessons for this course
        const lessons = await Lesson.find({ course: req.params.id });
        const lessonIds = lessons.map(lesson => lesson._id);
        
        // Delete all quizzes and questions for these lessons
        const quizzes = await Quiz.find({ lesson: { $in: lessonIds } });
        const quizIds = quizzes.map(quiz => quiz._id);
        
        await Question.deleteMany({ quiz: { $in: quizIds } });
        await Quiz.deleteMany({ lesson: { $in: lessonIds } });
        await Lesson.deleteMany({ course: req.params.id });
        await Enroll.deleteMany({ course: req.params.id });
        await Course.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Course and all related data deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//Enroll user in a course
export const enrollUserInCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        
        // Check if user is already enrolled
        const existingEnrollment = await Enroll.findOne({ user: userId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ success: false, message: "User is already enrolled in this course" });
        }
        
        // Create new enrollment
        const enrollment = new Enroll({
            user: userId,
            course: courseId,
            progress: 0,
            completedLessons: [],
            enrolledAt: new Date()
        });
        
        await enrollment.save();
        
        // Populate enrollment with user and course data
        await enrollment.populate('user', 'name username email');
        await enrollment.populate('course', 'title description noOfLessons');
        
        res.status(201).json({ success: true, message: "User enrolled successfully", enrollment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user enrollments
export const getUserEnrollments = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        
        const enrollments = await Enroll.find({ user: userId })
            .populate('course', 'title description thumbnailUrl noOfLessons')
            .populate('completedLessons', 'title')
            .sort({ enrolledAt: -1 });
        
        res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check if user is enrolled in a course
export const checkEnrollment = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        const enrollment = await Enroll.findOne({ user: userId, course: courseId })
            .populate('course', 'title noOfLessons')
            .populate('completedLessons', 'title');
        
        res.status(200).json({ 
            success: true, 
            isEnrolled: !!enrollment,
            enrollment: enrollment || null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark lesson as completed and update progress
export const markLessonCompleted = async (req, res) => {
    try {
        const { userId, courseId, lessonId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || 
            !mongoose.Types.ObjectId.isValid(courseId) || 
            !mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        
        // Find enrollment
        const enrollment = await Enroll.findOne({ user: userId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "User is not enrolled in this course" });
        }
        
        // Check if lesson exists in course
        const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found in this course" });
        }
        
        // Check if already completed
        if (enrollment.completedLessons.includes(lessonId)) {
            return res.status(400).json({ success: false, message: "Lesson already marked as completed" });
        }
        
        // Add lesson to completed lessons
        enrollment.completedLessons.push(lessonId);
        
        // Calculate progress
        const course = await Course.findById(courseId);
        if (course && course.noOfLessons > 0) {
            enrollment.progress = Math.round((enrollment.completedLessons.length / course.noOfLessons) * 100);
            
            // If progress is 100%, set completedAt
            if (enrollment.progress >= 100) {
                enrollment.completedAt = new Date();
            }
        }
        
        await enrollment.save();
        
        await enrollment.populate('completedLessons', 'title');
        await enrollment.populate('course', 'title noOfLessons');
        
        res.status(200).json({ 
            success: true, 
            message: "Lesson marked as completed",
            enrollment 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark course as completed
export const markCourseAsCompleted = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        // Find enrollment
        const enrollment = await Enroll.findOne({ user: userId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "User is not enrolled in this course" });
        }
        
        // Check if already completed
        if (enrollment.completedAt) {
            return res.status(400).json({ 
                success: false, 
                message: "Course already marked as completed",
                completedAt: enrollment.completedAt
            });
        }
        
        // Get all lessons for the course
        const allLessons = await Lesson.find({ course: courseId });
        const totalLessons = allLessons.length;
        
        // Get all quizzes for the course (through lessons)
        const lessonIds = allLessons.map(lesson => lesson._id);
        const allQuizzes = await Quiz.find({ lesson: { $in: lessonIds } });
        const totalQuizzes = allQuizzes.length;
        const allQuizIds = allQuizzes.map(quiz => quiz._id);
        
        // Check if all lessons are completed
        const completedLessonsCount = enrollment.completedLessons.length;
        if (completedLessonsCount < totalLessons) {
            return res.status(400).json({
                success: false,
                message: `Cannot complete course. You have completed ${completedLessonsCount} out of ${totalLessons} lessons.`,
                completedLessons: completedLessonsCount,
                totalLessons
            });
        }
        
        // Check if all quizzes are completed (passed)
        const completedQuizzesCount = enrollment.completedQuizzes.length;
        if (completedQuizzesCount < totalQuizzes) {
            return res.status(400).json({
                success: false,
                message: `Cannot complete course. You have passed ${completedQuizzesCount} out of ${totalQuizzes} quizzes.`,
                completedQuizzes: completedQuizzesCount,
                totalQuizzes
            });
        }
        
        // Get all quiz attempts for this user and course to calculate average score
        const quizAttempts = await Progress.find({
            user: userId,
            course: courseId,
            quiz: { $in: allQuizIds },
            passed: true
        }).sort({ attemptedAt: -1 });
        
        // Calculate average score from passed attempts (one per quiz)
        let totalScore = 0;
        const quizScores = new Map();
        
        // Get the latest passed attempt for each quiz
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
        
        await enrollment.populate('course', 'title description');
        
        res.status(200).json({
            success: true,
            message: "Course completed successfully! You can now generate your certificate.",
            enrollment: {
                _id: enrollment._id,
                course: enrollment.course,
                completedAt: enrollment.completedAt,
                averageScore: enrollment.averageScore,
                progress: enrollment.progress
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
