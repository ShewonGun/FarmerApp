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

