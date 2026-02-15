import mongoose from "mongoose";
import { locationFarmingFields } from "./LocationFarming.js";
import { financialInfoFields } from "./FinancialInfo.js";
import { verificationTrustFields } from "./VerificationTrust.js";
import { trainingEngagementFields } from "./TrainingEngagement.js";

// Core Identity Information fields for User
export const coreIdentityFields = {
    fullName: { type: String, required: true }, // Full legal name
    phoneNumber: { type: String, required: true, unique: true }, 
    email: { type: String, unique: true, sparse: true }, // Primary login
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: {
        type: String,
        enum: ["male", "female"]
    }
};

// Main User schema composed from topic-specific field groups
const userSchema = new mongoose.Schema({
    // Core Identity Information
    ...coreIdentityFields,

    // Location & Farming Information
    ...locationFarmingFields,

    // Financial & Loan-Relevant Information
    ...financialInfoFields,

    // Verification & Trust Layer
    ...verificationTrustFields,

    // Training & Engagement Data
    ...trainingEngagementFields,

    // System fields
    role: { type: String, enum: ["farmer", "admin"], default: "farmer" },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

export default User;

