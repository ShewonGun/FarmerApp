// tests/utils/loanCalculator.test.js
// Unit tests for the loanCalculator utility

import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";

describe("calculateLoanDetails", () => {
  test("should calculate correct totals for a flat monthly plan", () => {
    const plan = {
      duration: { value: 12, unit: "months" },
      interestRate: 10,
      interestType: "flat",
      paymentFrequency: "monthly",
    };

    const result = calculateLoanDetails(10000, plan);

    expect(result.totalPayable).toBe(11000);
    expect(result.totalInterest).toBe(1000);
    expect(result.installmentAmount).toBeCloseTo(916.67, 1);
    expect(result.monthlyInstallment).toBe(result.installmentAmount);
    expect(result.numberOfPayments).toBe(12);
  });

  test("should set remainingBalance equal to totalPayable at creation", () => {
    const plan = {
      duration: { value: 10, unit: "months" },
      interestRate: 0,
      interestType: "flat",
      paymentFrequency: "monthly",
    };

    const result = calculateLoanDetails(5000, plan);
    expect(result.remainingBalance).toBe(result.totalPayable);
  });

  test("should support weekly payment frequencies", () => {
    const plan = {
      duration: { value: 2, unit: "months" },
      interestRate: 12,
      interestType: "flat",
      paymentFrequency: "weekly",
    };

    const result = calculateLoanDetails(8000, plan);

    expect(result.numberOfPayments).toBe(8);
    expect(result.installmentAmount).toBeCloseTo(result.totalPayable / 8, 2);
  });

  test("should support reducing balance calculations", () => {
    const plan = {
      duration: { value: 12, unit: "months" },
      interestRate: 12,
      interestType: "reducing",
      paymentFrequency: "monthly",
    };

    const result = calculateLoanDetails(12000, plan);

    expect(result.numberOfPayments).toBe(12);
    expect(result.installmentAmount).toBeGreaterThan(0);
    expect(result.totalPayable).toBeGreaterThan(12000);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  test("should convert yearly durations to months", () => {
    const plan = {
      duration: { value: 1, unit: "years" },
      interestRate: 10,
      interestType: "simple",
      paymentFrequency: "monthly",
    };

    const result = calculateLoanDetails(1200, plan);

    expect(result.durationMonths).toBe(12);
    expect(result.numberOfPayments).toBe(12);
  });
});
