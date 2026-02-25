import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LoanCategory",
    required: true,
  },
  amount: Number,
  durationMonths: Number,
  interestRate: Number,

  totalPayable: Number,
  monthlyInstallment: Number,
  totalPaid: { type: Number, default: 0 },
  remainingBalance: Number,

  nextDueDate: Date,
  arrearsAmount: { type: Number, default: 0 },

  exchangeRateUsed: Number,
  amountInUSD: Number,

  status: {
    type: String,
    enum: ["Pending", "Approved", "Active", "Rejected", "Completed"],
    default: "Pending",
  },

  approvedAt: Date,
  disbursedAt: Date,
}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
