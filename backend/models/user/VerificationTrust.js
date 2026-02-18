import mongoose from "mongoose";

// Verification & Trust Layer fields for User
export const verificationTrustFields = {
    governmentNicNumber: { type: String },
    nicImage1Url: { type: String }, // path or URL to first NIC image
    nicImage2Url: { type: String }, // path or URL to second NIC image
    agreedToTerms: { type: Boolean, default: false },
    consentToDataPolicy: { type: Boolean, default: false },
    verifiedDate: { type: Date },
    verificationStatus: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending"
    }
};

// Separate collection for user verification & trust info
const verificationTrustSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        ...verificationTrustFields
    },
    {
        timestamps: true
    }
);

const UserTrust = mongoose.model("UserTrust", verificationTrustSchema);

export default UserTrust;

