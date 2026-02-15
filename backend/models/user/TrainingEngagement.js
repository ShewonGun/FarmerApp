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

