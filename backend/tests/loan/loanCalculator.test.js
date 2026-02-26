// tests/utils/loanCalculator.test.js
// Unit tests for the loanCalculator utility

import { calculateLoanDetails } from "../../utils/loan/loanCalculator.js";

describe("calculateLoanDetails", () => {
  test("should calculate correct totalPayable", () => {
    const result = calculateLoanDetails(10000, 10, 12);
    // Interest = 10000 * 10 / 100 = 1000
    // Total payable = 10000 + 1000 = 11000
    expect(result.totalPayable).toBe(11000);
  });

  test("should calculate correct monthlyInstallment", () => {
    const result = calculateLoanDetails(10000, 10, 12);
    // Monthly installment = 11000 / 12 ≈ 916.67
    expect(result.monthlyInstallment).toBeCloseTo(916.67, 1);
  });

  test("should set remainingBalance equal to totalPayable at creation", () => {
    const result = calculateLoanDetails(10000, 10, 12);
    expect(result.remainingBalance).toBe(result.totalPayable);
  });

  test("should handle 0% interest rate", () => {
    const result = calculateLoanDetails(5000, 0, 10);
    expect(result.totalPayable).toBe(5000);
    expect(result.monthlyInstallment).toBe(500);
    expect(result.remainingBalance).toBe(5000);
  });

  test("should handle single month duration", () => {
    const result = calculateLoanDetails(1200, 10, 1);
    // totalPayable = 1200 + 120 = 1320
    // monthlyInstallment = 1320 / 1 = 1320
    expect(result.totalPayable).toBe(1320);
    expect(result.monthlyInstallment).toBe(1320);
  });

  test("should handle large loan amounts", () => {
    const result = calculateLoanDetails(1000000, 15, 24);
    const expectedInterest = (1000000 * 15) / 100;
    const expectedTotal = 1000000 + expectedInterest;
    expect(result.totalPayable).toBe(expectedTotal);
    expect(result.remainingBalance).toBe(expectedTotal);
    expect(result.monthlyInstallment).toBeCloseTo(expectedTotal / 24, 2);
  });
});
