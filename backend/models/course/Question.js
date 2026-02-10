import mongoose from "mongoose";

const choiceSchema = new mongoose.Schema({
    choiceText: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
});

const questionSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    questionText: { type: String, required: true },
    choices: [choiceSchema], 
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model("Question", questionSchema);

export default Question;
