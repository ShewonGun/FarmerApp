// Verification & Trust Layer fields for User
export const verificationTrustFields = {
    governmentNicNumber: { type: String },
    nicImage1Url: { type: String }, // path or URL to first NIC image
    nicImage2Url: { type: String }, // path or URL to second NIC image
    selfieUrl: { type: String }, // optional selfie image
    agreedToTerms: { type: Boolean, default: false },
    consentToDataPolicy: { type: Boolean, default: false },
    verifiedDate: { type: Date },
    verificationStatus: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending"
    }
};

