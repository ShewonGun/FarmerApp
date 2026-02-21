import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    planName: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    duration: {
      value: { type: Number, required: true, min: 1},
      unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'months', required: true,}
    },
    interestRate: { type: Number, required: true, min: 1, max: 100 },
    interestType: { type: String, enum: ['simple', 'compound', 'flat', 'reducing'], default: 'flat', required: true},
    paymentFrequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'quarterly'], default: 'monthly', required: true},
    maxLoanAmount: { type: Number, required: true, min: 0 },
    minLoanAmount: { type: Number, required: true, min: 0 },
    latePenalty: {
      type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      value: { type: Number, default: 0, min: 0 },
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Plan = mongoose.model("Plan", planSchema);

export default Plan;