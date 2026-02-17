import mongoose from "mongoose";

// Training & Engagement Data fields for User
export const trainingEngagementFields = {
    literacyLevel: {
        type: String,
        enum: ["none", "basic", "intermediate", "advanced"],
        default: "basic"
    },
    preferredLanguage: {
        type: String,
        enum: ["english", "local", "other"],
        default: "local"
    },
    areasOfInterest: [{ type: String }] // e.g., irrigation, crop disease, finance
};

// Separate collection for user training & engagement info
const trainingEngagementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        ...trainingEngagementFields
    },
    {
        timestamps: true
    }
);

const UserEngagement = mongoose.model("UserEngagement", trainingEngagementSchema);

export default UserEngagement;

