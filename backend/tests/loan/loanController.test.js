// tests/loan/loanController.test.js
// Unit tests for loanController: createLoan, approveLoan, addRepayment, getRepaymentsByLoan

import {
  createLoan,
  approveLoan,
  addRepayment,
  getRepaymentsByLoan,
} from "../../controllers/loanControllers/loanController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../models/loan/Loan.js");
jest.mock("../../models/loan/LoanCategory.js");
jest.mock("../../models/loan/Repayment.js");
jest.mock("../../utils/loan/loanCalculator.js");
jest.mock("../../utils/loan/exchangeRateService.js");

import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";
import Repayment from "../../models/loan/Repayment.js";
import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";
import { getExchangeRate } from "../../utils/loan/exchangeRateService.js";

// ─── createLoan ───────────────────────────────────────────────────────────────
describe("createLoan", () => {
  test("should create a loan and return 201", async () => {
    const mockCategory = { _id: "cat1", interestRate: 10 };
    LoanCategory.findById.mockResolvedValue(mockCategory);
    getExchangeRate.mockResolvedValue(0.0009);
    calculateLoanDetails.mockReturnValue({
      totalPayable: 11000,
      monthlyInstallment: 916.67,
      remainingBalance: 11000,
    });

    const mockLoan = {
      _id: "loan1",
      farmerId: "farmer1",
      amount: 10000,
      durationMonths: 12,
    };
    Loan.create.mockResolvedValue(mockLoan);

    const req = mockRequest({
      body: { farmerId: "farmer1", amount: 10000, categoryId: "cat1", durationMonths: 12 },
    });
    const res = mockResponse();

    await createLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockLoan);
  });

  test("should return 500 on server error", async () => {
    LoanCategory.findById.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({
      body: { farmerId: "farmer1", amount: 10000, categoryId: "cat1", durationMonths: 12 },
    });
    const res = mockResponse();

    await createLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "DB error" }));
  });
});

// ─── approveLoan ──────────────────────────────────────────────────────────────
describe("approveLoan", () => {
  test("should approve the loan and return 200", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockLoan = {
      _id: "loan1",
      status: "Pending",
      approvedAt: null,
      disbursedAt: null,
      nextDueDate: null,
      save: saveMock,
    };
    Loan.findById.mockResolvedValue(mockLoan);

    const req = mockRequest({ params: { id: "loan1" } });
    const res = mockResponse();

    await approveLoan(req, res);

    expect(mockLoan.status).toBe("Active");
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Loan Approved" })
    );
  });
});

// ─── addRepayment ─────────────────────────────────────────────────────────────
describe("addRepayment", () => {
  test("should add a repayment and update loan balance", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockLoan = {
      _id: "loan1",
      totalPaid: 0,
      remainingBalance: 5000,
      status: "Active",
      nextDueDate: new Date("2026-01-01"),
      save: saveMock,
    };
    Loan.findById.mockResolvedValue(mockLoan);
    Repayment.create.mockResolvedValue({});

    const req = mockRequest({ params: { loanId: "loan1" }, body: { amount: 500 } });
    const res = mockResponse();

    await addRepayment(req, res);

    expect(mockLoan.totalPaid).toBe(500);
    expect(mockLoan.remainingBalance).toBe(4500);
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Payment Successful" })
    );
  });

  test("should mark loan as Completed when balance reaches 0", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockLoan = {
      _id: "loan1",
      totalPaid: 4500,
      remainingBalance: 500,
      status: "Active",
      nextDueDate: new Date("2026-01-01"),
      save: saveMock,
    };
    Loan.findById.mockResolvedValue(mockLoan);
    Repayment.create.mockResolvedValue({});

    const req = mockRequest({ params: { loanId: "loan1" }, body: { amount: 500 } });
    const res = mockResponse();

    await addRepayment(req, res);

    expect(mockLoan.status).toBe("Completed");
  });
});

// ─── getRepaymentsByLoan ──────────────────────────────────────────────────────
describe("getRepaymentsByLoan", () => {
  test("should return all repayments for a loan", async () => {
    const mockRepayments = [
      { _id: "rep1", loanId: "loan1", amount: 500 },
      { _id: "rep2", loanId: "loan1", amount: 500 },
    ];
    Repayment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockRepayments) });

    const req = mockRequest({ params: { loanId: "loan1" } });
    const res = mockResponse();

    await getRepaymentsByLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockRepayments);
  });

  test("should return 500 on server error", async () => {
    Repayment.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest({ params: { loanId: "loan1" } });
    const res = mockResponse();

    await getRepaymentsByLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
