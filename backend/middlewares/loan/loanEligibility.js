import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";

export const checkLoanEligibility = async (req, res, next) => {
  const { farmerId, amount, categoryId } = req.body;

  const activeLoan = await Loan.findOne({
    farmerId,
    status: { $in: ["Active", "Pending"] },
  });

  if (activeLoan) {
    return res.status(400).json({ message: "Active loan exists" });
  }

  const category = await LoanCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  if (amount > category.maxAmount) {
    return res.status(400).json({ message: "Amount exceeds limit" });
  }

  next();
};
