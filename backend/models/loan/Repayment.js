import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true,
  },
  amount: { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  scheduledDueDate: Date,
  installmentsCovered: { type: Number, default: 0 },
  wasOverdue: { type: Boolean, default: false },
  overdueAmountBeforePayment: { type: Number, default: 0 },
  overdueAmountAfterPayment: { type: Number, default: 0 },
  installmentProgressAfterPayment: { type: Number, default: 0 },
}, { timestamps: true });

const Repayment = mongoose.model("Repayment", repaymentSchema);
export default Repayment;
