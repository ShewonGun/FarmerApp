import mongoose from "mongoose";

// Platform Service Rating Fields
export const platformServiceRatingFields = {
    overallRating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    loanServiceRating: { type: Number, min: 1, max: 5 },

    trainingServiceRating: { type: Number, min: 1, max: 5 },

    supportServiceRating: { type: Number, min: 1, max: 5 },

    usabilityRating: { type: Number, min: 1, max: 5 },

    feedback: { type: String }
};

// Separate collection for platform ratings
const platformServiceRatingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true   // One platform rating per farmer
        },

        ...platformServiceRatingFields
    },
    {
        timestamps: true
    }
);

const PlatformServiceRating = mongoose.model(
    "PlatformServiceRating",
    platformServiceRatingSchema
);

export default PlatformServiceRating;
