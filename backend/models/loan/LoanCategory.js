import mongoose from "mongoose";

const loanCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  requiredDocuments: {
    type: [String],
    default: [],
  },
  eligiblePurposes: {
    type: [String],
    default: [],
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const LoanCategory = mongoose.model("LoanCategory", loanCategorySchema);
export default LoanCategory;
