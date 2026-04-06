import mongoose from "mongoose";

// Financial & Loan-Relevant Information fields for User
export const financialInfoFields = {
    estimatedIncome: { type: Number }, 
    numberOfDependents: { type: Number },
    dependentNames: [{ type: String }],
    existingDebtAmount: { type: Number, default: 0 },
    bankName: { type: String },
    cardNumber: { type: String },
    cvvNumber: { type: String },
    expiryMonth: { type: String },
    expiryYear: { type: String },
   
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

