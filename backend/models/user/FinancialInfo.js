import mongoose from "mongoose";

// Financial & Loan-Relevant Information fields for User
export const financialInfoFields = {
    estimatedIncome: { type: Number }, 
    numberOfDependents: { type: Number, default: 2, immutable: true, min: 2, max: 2 },
    dependentNames: {
        type: [{ type: String, trim: true }],
        validate: {
            validator: function (names) {
                const validNames = (names || []).map((name) => String(name || "").trim()).filter(Boolean);
                return validNames.length >= 2;
            },
            message: "Please provide at least two guarantor names separated by a comma."
        }
    },
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

