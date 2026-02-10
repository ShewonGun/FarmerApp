import mongoose from "mongoose";

const enrollSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    completedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    averageScore: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

// Create compound index to prevent duplicate enrollments
enrollSchema.index({ user: 1, course: 1 }, { unique: true });

const Enroll = mongoose.model("Enroll", enrollSchema);

export default Enroll;