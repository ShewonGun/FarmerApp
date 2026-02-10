import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedChoice: { type: mongoose.Schema.Types.ObjectId, required: true },
    isCorrect: { type: Boolean, required: true }
});

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now }
});

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
