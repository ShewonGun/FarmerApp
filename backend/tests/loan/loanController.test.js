// tests/loan/loanController.test.js
// Unit tests for loanController: createLoan, approveLoan, addRepayment, getRepaymentsByLoan

import {
  createLoan,
  approveLoan,
  addRepayment,
  getRepaymentsByLoan,
} from "../../controllers/loanControllers/loanController.js";
import { mockRequest, mockResponse } from "../setup.js";

jest.mock("../../models/loan/Loan.js");
jest.mock("../../models/loan/LoanCategory.js");
jest.mock("../../models/admin/Plan.js");
jest.mock("../../models/loan/Repayment.js");
jest.mock("../../utils/loan/loanCalculator.js");
jest.mock("../../utils/loan/exchangeRateService.js");

import Loan from "../../models/loan/Loan.js";
import LoanCategory from "../../models/loan/LoanCategory.js";
import Plan from "../../models/admin/Plan.js";
import Repayment from "../../models/loan/Repayment.js";
import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";
import { getExchangeRate } from "../../utils/loan/exchangeRateService.js";

const farmerUser = {
  _id: "507f1f77bcf86cd799439011",
  role: "farmer",
};

const adminUser = {
  _id: "507f1f77bcf86cd799439099",
  role: "admin",
};

describe("createLoan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a loan from category and plan data and return 201", async () => {
    const mockCategory = { _id: "507f1f77bcf86cd799439012", name: "Crop Loan", isActive: true };
    const mockPlan = {
      _id: "507f1f77bcf86cd799439013",
      planName: "Starter Plan",
      interestRate: 10,
      interestType: "flat",
      paymentFrequency: "monthly",
      minLoanAmount: 1000,
      maxLoanAmount: 20000,
      latePenalty: { type: "percentage", value: 2 },
      isActive: true,
    };

    LoanCategory.findById.mockResolvedValue(mockCategory);
    Plan.findById.mockResolvedValue(mockPlan);
    getExchangeRate.mockResolvedValue(0.0009);
    calculateLoanDetails.mockReturnValue({
      durationMonths: 12,
      numberOfPayments: 12,
      totalInterest: 1000,
      totalPayable: 11000,
      installmentAmount: 916.67,
      remainingBalance: 11000,
    });

    const mockLoan = {
      _id: "loan1",
      farmerId: "507f1f77bcf86cd799439011",
      amount: 10000,
      plan: "507f1f77bcf86cd799439013",
      category: "507f1f77bcf86cd799439012",
      installmentAmount: 916.67,
      toObject: jest.fn().mockReturnValue({ installmentAmount: 916.67 }),
    };
    Loan.create.mockResolvedValue(mockLoan);

    const req = mockRequest({
      user: farmerUser,
      body: {
        amount: 10000,
        categoryId: "507f1f77bcf86cd799439012",
        planId: "507f1f77bcf86cd799439013",
      },
    });
    const res = mockResponse();

    await createLoan(req, res);

    expect(Loan.create).toHaveBeenCalledWith(expect.objectContaining({
      farmerId: farmerUser._id,
      monthlyInstallment: 916.67,
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("should return 400 when required create-loan fields are missing", async () => {
    const req = mockRequest({
      user: farmerUser,
      body: { amount: 10000, categoryId: "507f1f77bcf86cd799439012" },
    });
    const res = mockResponse();

    await createLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("approveLoan", () => {
  test("should approve the loan and return 200", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockLoan = {
      _id: "507f1f77bcf86cd799439011",
      status: "Pending",
      approvedAt: null,
      disbursedAt: null,
      nextDueDate: null,
      paymentFrequency: "monthly",
      installmentAmount: 500,
      installmentPaidAmount: 250,
      arrearsAmount: 100,
      save: saveMock,
      toObject: jest.fn().mockReturnValue({ installmentAmount: 500 }),
    };
    Loan.findById.mockResolvedValue(mockLoan);

    const req = mockRequest({ params: { id: "507f1f77bcf86cd799439011" }, user: adminUser });
    const res = mockResponse();

    await approveLoan(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Loan Approved" }));
  });
});

describe("addRepayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should add a repayment for the loan owner", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockLoan = {
      _id: "loan1",
      farmerId: { toString: () => "507f1f77bcf86cd799439011" },
      totalPaid: 0,
      remainingBalance: 5000,
      installmentAmount: 1000,
      monthlyInstallment: 1000,
      installmentPaidAmount: 0,
      arrearsAmount: 0,
      status: "Active",
      paymentFrequency: "monthly",
      nextDueDate: new Date("2026-04-01T00:00:00.000Z"),
      save: saveMock,
      toObject: jest.fn().mockReturnValue({ installmentAmount: 1000, monthlyInstallment: 1000 }),
    };
    Loan.findById.mockResolvedValue(mockLoan);
    Repayment.create.mockResolvedValue({});

    const req = mockRequest({
      user: farmerUser,
      params: { loanId: "507f1f77bcf86cd799439011" },
      body: { amount: 500, paidDate: "2026-04-01T12:00:00.000Z" },
    });
    const res = mockResponse();

    await addRepayment(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Payment Successful" }));
  });

  test("should return 403 when another farmer tries to repay the loan", async () => {
    const mockLoan = {
      _id: "loan1",
      farmerId: { toString: () => "507f1f77bcf86cd799439055" },
      status: "Active",
    };
    Loan.findById.mockResolvedValue(mockLoan);

    const req = mockRequest({
      user: farmerUser,
      params: { loanId: "507f1f77bcf86cd799439011" },
      body: { amount: 500 },
    });
    const res = mockResponse();

    await addRepayment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("getRepaymentsByLoan", () => {
  test("should return repayments for the loan owner", async () => {
    const mockRepayments = [
      { _id: "rep1", loanId: "loan1", amount: 500 },
      { _id: "rep2", loanId: "loan1", amount: 500 },
    ];
    Loan.findById.mockResolvedValue({
      _id: "loan1",
      farmerId: { toString: () => "507f1f77bcf86cd799439011" },
    });
    Repayment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockRepayments) });

    const req = mockRequest({ params: { loanId: "507f1f77bcf86cd799439011" }, user: farmerUser });
    const res = mockResponse();

    await getRepaymentsByLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should return 403 when another farmer tries to view repayments", async () => {
    Loan.findById.mockResolvedValue({
      _id: "loan1",
      farmerId: { toString: () => "507f1f77bcf86cd799439055" },
    });

    const req = mockRequest({ params: { loanId: "507f1f77bcf86cd799439011" }, user: farmerUser });
    const res = mockResponse();

    await getRepaymentsByLoan(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
