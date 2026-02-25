import mongoose from "mongoose";

// Financial & Loan-Relevant Information fields for User
export const financialInfoFields = {
    estimatedIncome: { type: Number }, // monthly or seasonal (client defines)
    numberOfDependents: { type: Number },
    dependentNames: [{ type: String }],
    hasExistingLoans: { type: Boolean, default: false },
    existingDebtAmount: { type: Number },
    bankAccountNumber: { type: String },
    bankName: { type: String },
    preferredPaymentMethod: {
        type: String,
        enum: ["bank_transfer", "mobile_money", "cash", "other"],
        default: "mobile_money"
    }
};

// Separate collection for user financial info
const financialInfoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        ...financialInfoFields
    },
    {
        timestamps: true
    }
);

const UserFinance = mongoose.model("UserFinance", financialInfoSchema);

export default UserFinance;

