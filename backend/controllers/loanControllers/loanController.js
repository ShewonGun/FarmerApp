import mongoose from "mongoose";
import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";
import Plan from "../../models/admin/Plan.js";
import Repayment from "../../models/loan/Repayment.js";
import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";
import { getExchangeRate } from "../../utils/loan/exchangeRateService.js";

const CURRENCY_PRECISION = 100;
const INSTALLMENT_EPSILON = 0.01;

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * CURRENCY_PRECISION) / CURRENCY_PRECISION;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizePaymentFrequency = (paymentFrequency) => {
  if (["weekly", "biweekly", "monthly", "quarterly"].includes(paymentFrequency)) {
    return paymentFrequency;
  }

  return "monthly";
};

const advanceDueDate = (date, paymentFrequency = "monthly", periods = 1) => {
  const nextDate = new Date(date);
  const normalizedFrequency = normalizePaymentFrequency(paymentFrequency);

  switch (normalizedFrequency) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + (7 * periods));
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + (14 * periods));
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + (3 * periods));
      break;
    case "monthly":
    default:
      nextDate.setMonth(nextDate.getMonth() + periods);
      break;
  }

  return nextDate;
};

const startOfDay = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

const getInstallmentAmount = (loan) => roundCurrency(loan.installmentAmount || loan.monthlyInstallment || 0);

const countOverdueInstallments = (nextDueDate, asOfDate, paymentFrequency) => {
  if (!nextDueDate || !asOfDate) {
    return 0;
  }

  const dueDateCursor = startOfDay(nextDueDate);
  const paymentDate = startOfDay(asOfDate);

  if (paymentDate <= dueDateCursor) {
    return 0;
  }

  let overdueInstallments = 0;
  let cursor = new Date(dueDateCursor);

  while (cursor < paymentDate) {
    overdueInstallments += 1;
    cursor = advanceDueDate(cursor, paymentFrequency, 1);
  }

  return overdueInstallments;
};

const calculateArrearsAmount = (loan, asOfDate) => {
  const installmentAmount = getInstallmentAmount(loan);

  if (!loan?.nextDueDate || !installmentAmount || loan.status === "Completed") {
    return 0;
  }

  const overdueInstallments = countOverdueInstallments(
    loan.nextDueDate,
    asOfDate,
    loan.paymentFrequency
  );

  if (overdueInstallments === 0) {
    return 0;
  }

  const overdueAmount = (overdueInstallments * installmentAmount) - (loan.installmentPaidAmount || 0);
  return roundCurrency(Math.max(overdueAmount, 0));
};

const applyPaymentToInstallments = (loan, amount) => {
  const installmentAmount = getInstallmentAmount(loan);
  let remainingPayment = roundCurrency(amount);
  let installmentPaidAmount = roundCurrency(loan.installmentPaidAmount || 0);
  let installmentsCovered = 0;
  let nextDueDate = loan.nextDueDate ? new Date(loan.nextDueDate) : null;

  while (remainingPayment > INSTALLMENT_EPSILON && nextDueDate) {
    const amountNeeded = roundCurrency(installmentAmount - installmentPaidAmount);
    const appliedAmount = Math.min(remainingPayment, amountNeeded);

    installmentPaidAmount = roundCurrency(installmentPaidAmount + appliedAmount);
    remainingPayment = roundCurrency(remainingPayment - appliedAmount);

    if (installmentPaidAmount >= installmentAmount - INSTALLMENT_EPSILON) {
      installmentPaidAmount = 0;
      installmentsCovered += 1;
      nextDueDate = advanceDueDate(nextDueDate, loan.paymentFrequency, 1);
    }
  }

  loan.installmentPaidAmount = installmentPaidAmount;
  loan.nextDueDate = nextDueDate;

  return {
    installmentsCovered,
    installmentProgressAfterPayment: installmentPaidAmount,
  };
};

const buildLoanResponse = (loan) => ({
  ...loan,
  monthlyInstallment: loan.monthlyInstallment || loan.installmentAmount,
});

const canAccessLoan = (loan, user) => {
  if (!loan || !user) {
    return false;
  }

  return user.role === "admin" || loan.farmerId?.toString() === user._id?.toString();
};

export const createLoan = async (req, res) => {
  try {
    const farmerId = req.user?._id;
    const { amount, categoryId, planId } = req.body;
    const normalizedAmount = roundCurrency(Number(amount));

    if (!farmerId || !categoryId || !planId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: "amount, categoryId and planId are required" });
    }

    if (![farmerId, categoryId, planId].every(isValidObjectId)) {
      return res.status(400).json({ message: "Invalid farmerId, categoryId or planId" });
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

    if (normalizedAmount < plan.minLoanAmount || normalizedAmount > plan.maxLoanAmount) {
      return res.status(400).json({
        message: `Loan amount must be between ${plan.minLoanAmount} and ${plan.maxLoanAmount}`,
      });
    }

    const rateUSD = await getExchangeRate();
    const loanDetails = calculateLoanDetails(normalizedAmount, plan);

    const loan = await Loan.create({
      farmerId,
      category: categoryId,
      plan: planId,
      planName: plan.planName,
      amount: normalizedAmount,
      durationMonths: loanDetails.durationMonths,
      numberOfPayments: loanDetails.numberOfPayments,
      interestRate: plan.interestRate,
      interestType: plan.interestType,
      paymentFrequency: plan.paymentFrequency,
      latePenalty: plan.latePenalty,
      exchangeRateUsed: rateUSD,
      amountInUSD: normalizedAmount * rateUSD,
      ...loanDetails,
      monthlyInstallment: loanDetails.installmentAmount,
    });

    return res.status(201).json(buildLoanResponse(loan.toObject ? loan.toObject() : loan));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyLoans = async (req, res) => {
  try {
    const farmerId = req.user?._id;

    if (!farmerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const loans = await Loan.find({ farmerId })
      .populate("category", "name code description requiredDocuments")
      .populate("plan", "planName paymentFrequency duration interestRate interestType")
      .sort({ createdAt: -1 });

    const loanResponses = loans.map((loan) => {
      const loanObject = loan.toObject ? loan.toObject() : loan;
      return {
        ...buildLoanResponse(loanObject),
        categoryName: loanObject.category?.name || loanObject.categoryName || "Loan Category",
        planName: loanObject.planName || loanObject.plan?.planName || "Repayment Plan",
      };
    });

    return res.status(200).json({
      success: true,
      loans: loanResponses,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllLoansForAdmin = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate("farmerId", "name email role")
      .populate("category", "name code description")
      .populate("plan", "planName paymentFrequency duration interestRate interestType")
      .sort({ createdAt: -1 });

    const loanResponses = loans.map((loan) => {
      const loanObject = loan.toObject ? loan.toObject() : loan;
      return {
        ...buildLoanResponse(loanObject),
        categoryName: loanObject.category?.name || loanObject.categoryName || "Loan Category",
        planName: loanObject.planName || loanObject.plan?.planName || "Repayment Plan",
        farmerName: loanObject.farmerId?.name || loanObject.farmerName || "Unknown Farmer",
        farmerEmail: loanObject.farmerId?.email || loanObject.farmerEmail || "",
      };
    });

    return res.status(200).json({
      success: true,
      loans: loanResponses,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const approveLoan = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid loan ID" });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status === "Completed") {
      return res.status(400).json({ message: "Completed loans cannot be approved again" });
    }

    loan.status = "Active";
    loan.approvedAt = new Date();
    loan.disbursedAt = new Date();
    loan.installmentPaidAmount = 0;
    loan.arrearsAmount = 0;
    loan.nextDueDate = advanceDueDate(new Date(), loan.paymentFrequency, 1);

    await loan.save();

    return res.json({ message: "Loan Approved", loan: buildLoanResponse(loan.toObject ? loan.toObject() : loan) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const rejectLoan = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid loan ID" });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status === "Active" || loan.status === "Completed") {
      return res.status(400).json({ message: "Active or completed loans cannot be rejected" });
    }

    loan.status = "Rejected";
    loan.nextDueDate = null;
    loan.arrearsAmount = 0;
    loan.installmentPaidAmount = 0;

    await loan.save();

    return res.status(200).json({
      message: "Loan Rejected",
      loan: buildLoanResponse(loan.toObject ? loan.toObject() : loan),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addRepayment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.loanId)) {
      return res.status(400).json({ message: "Invalid loan ID" });
    }

    const amount = roundCurrency(Number(req.body.amount));
    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (!canAccessLoan(loan, req.user)) {
      return res.status(403).json({ message: "Access denied. You can only repay your own loans." });
    }

    if (loan.status !== "Active") {
      return res.status(400).json({ message: "Repayments can only be recorded for active loans" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Repayment amount must be greater than 0" });
    }

    if (Number.isNaN(paidDate.getTime())) {
      return res.status(400).json({ message: "Invalid paid date" });
    }

    if (amount - roundCurrency(loan.remainingBalance || 0) > INSTALLMENT_EPSILON) {
      return res.status(400).json({ message: "Repayment amount cannot exceed the remaining balance" });
    }

    const scheduledDueDate = loan.nextDueDate ? new Date(loan.nextDueDate) : null;
    const overdueAmountBeforePayment = calculateArrearsAmount(loan, paidDate);
    const paymentSummary = applyPaymentToInstallments(loan, amount);

    loan.totalPaid = roundCurrency((loan.totalPaid || 0) + amount);
    loan.remainingBalance = roundCurrency(Math.max((loan.remainingBalance || 0) - amount, 0));

    if (loan.remainingBalance <= INSTALLMENT_EPSILON) {
      loan.status = "Completed";
      loan.remainingBalance = 0;
      loan.installmentPaidAmount = 0;
      loan.arrearsAmount = 0;
      loan.nextDueDate = null;
    } else {
      loan.arrearsAmount = calculateArrearsAmount(loan, paidDate);
    }

    await Repayment.create({
      loanId: loan._id,
      amount,
      paidDate,
      scheduledDueDate,
      installmentsCovered: paymentSummary.installmentsCovered,
      wasOverdue: overdueAmountBeforePayment > 0,
      overdueAmountBeforePayment,
      overdueAmountAfterPayment: loan.arrearsAmount,
      installmentProgressAfterPayment: loan.installmentPaidAmount || 0,
    });

    await loan.save();

    return res.json({
      message: "Payment Successful",
      loan: buildLoanResponse(loan.toObject ? loan.toObject() : loan),
      repaymentSummary: {
        overdueAmountBeforePayment,
        overdueAmountAfterPayment: loan.arrearsAmount,
        installmentsCovered: paymentSummary.installmentsCovered,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRepaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    if (!isValidObjectId(loanId)) {
      return res.status(400).json({ message: "Invalid loan ID" });
    }

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (!canAccessLoan(loan, req.user)) {
      return res.status(403).json({ message: "Access denied. You can only view repayments for your own loans." });
    }

    const repayments = await Repayment.find({ loanId }).sort({ paidDate: 1 });
    res.status(200).json(repayments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
