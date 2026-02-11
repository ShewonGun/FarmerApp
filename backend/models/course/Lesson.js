import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    assetUrl: { type: String },
    youtubeUrl: { type: String },
    thumbnailUrl: { type: String },
    isQuizAvailable: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;