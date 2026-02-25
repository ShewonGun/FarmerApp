import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true,
  },
  amount: Number,
  paidDate: { type: Date, default: Date.now },
}, { timestamps: true });

const Repayment = mongoose.model("Repayment", repaymentSchema);
export default Repayment;
