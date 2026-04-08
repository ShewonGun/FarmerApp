import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";
import Plan from "../../models/admin/Plan.js";

export const checkLoanEligibility = async (req, res, next) => {
  const farmerId = req.user?._id;
  const { amount, categoryId, planId } = req.body;

  const activeLoan = await Loan.findOne({
    farmerId,
    status: { $in: ["Active", "Pending"] },
  });

  if (activeLoan) {
    return res.status(400).json({ message: "Active loan exists" });
  }

  const [category, plan] = await Promise.all([
    LoanCategory.findById(categoryId),
    Plan.findById(planId),
  ]);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  if (category.isActive === false) {
    return res.status(400).json({ message: "Selected category is not active" });
  }

  if (!plan.isActive) {
    return res.status(400).json({ message: "Selected plan is not active" });
  }

  if (amount < plan.minLoanAmount || amount > plan.maxLoanAmount) {
    return res.status(400).json({
      message: `Loan amount must be between ${plan.minLoanAmount} and ${plan.maxLoanAmount}`,
    });
  }

  next();
};
