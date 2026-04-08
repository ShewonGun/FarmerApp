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
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  planName: String,
  amount: Number,
  durationMonths: Number,
  numberOfPayments: Number,
  interestRate: Number,
  interestType: String,
  paymentFrequency: {
    type: String,
    enum: ["weekly", "biweekly", "monthly", "quarterly"],
    default: "monthly",
  },
  latePenalty: {
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    value: {
      type: Number,
      default: 0,
    },
  },

  totalPayable: Number,
  totalInterest: Number,
  installmentAmount: Number,
  // Backward-compatible alias retained for existing consumers.
  monthlyInstallment: Number,
  totalPaid: { type: Number, default: 0 },
  remainingBalance: Number,
  installmentPaidAmount: { type: Number, default: 0 },

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
