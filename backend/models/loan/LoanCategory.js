import mongoose from "mongoose";

const loanCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  maxAmount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const LoanCategory = mongoose.model("LoanCategory", loanCategorySchema);
export default LoanCategory;
