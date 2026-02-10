import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    certificateNumber: { type: String, required: true, unique: true },
    certificateUrl: { type: String },
    issueDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    averageScore: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

// Generate unique certificate number before saving
certificateSchema.pre('save', async function() {
    if (!this.certificateNumber) {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.certificateNumber = `CERT-${year}-${random}`;
    }
});

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
