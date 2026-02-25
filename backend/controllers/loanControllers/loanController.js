import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";
import Repayment from "../../models/loan/Repayment.js";
import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";
import { getExchangeRate } from "../../utils/loan/exchangeRateService.js";

export const createLoan = async (req, res) => {
  try {
    const { farmerId, amount, categoryId, durationMonths } = req.body;

    const category = await LoanCategory.findById(categoryId);

    const rateUSD = await getExchangeRate();

    const loanDetails = calculateLoanDetails(
      amount,
      category.interestRate,
      durationMonths
    );

    const loan = await Loan.create({
      farmerId,
      category: categoryId,
      amount,
      durationMonths,
      interestRate: category.interestRate,
      exchangeRateUsed: rateUSD,
      amountInUSD: amount * rateUSD,
      ...loanDetails,
    });

    res.status(201).json(loan);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveLoan = async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  loan.status = "Active";
  loan.approvedAt = new Date();
  loan.disbursedAt = new Date();

  const nextDue = new Date();
  nextDue.setMonth(nextDue.getMonth() + 1);
  loan.nextDueDate = nextDue;

  await loan.save();

  res.json({ message: "Loan Approved", loan });
};

export const addRepayment = async (req, res) => {
  const { amount } = req.body;
  const loan = await Loan.findById(req.params.loanId);

  await Repayment.create({
    loanId: loan._id,
    amount,
  });

  loan.totalPaid += amount;
  loan.remainingBalance -= amount;

  if (loan.remainingBalance <= 0) {
    loan.status = "Completed";
  }

  const nextDue = new Date(loan.nextDueDate);
  nextDue.setMonth(nextDue.getMonth() + 1);
  loan.nextDueDate = nextDue;

  await loan.save();

  res.json({ message: "Payment Successful", loan });
};

export const getRepaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const repayments = await Repayment.find({ loanId }).sort({ paidDate: 1 });
    res.status(200).json(repayments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
