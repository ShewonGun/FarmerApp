// tests/plan/planController.test.js
// Unit tests for planController: createPlan, getAllPlans, getActivePlans, getPlanById,
// updatePlan, togglePlanStatus, deletePlan, calculateEMI

import {
  createPlan,
  getAllPlans,
  getActivePlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  calculateEMI,
} from "../../../controllers/adminControllers/planController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/admin/Plan.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
}));

import Plan from "../../../models/admin/Plan.js";
import mongoose from "mongoose";

const validId = "507f1f77bcf86cd799439011";

// ─── createPlan ───────────────────────────────────────────────────────────────
describe("createPlan", () => {
  test("should return 400 if required fields are missing", async () => {
    const req = mockRequest({ body: { planName: "Gold Plan" } }); // missing many required fields
    const res = mockResponse();

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Please provide all required fields" })
    );
  });

  test("should return 400 if minLoanAmount > maxLoanAmount", async () => {
    const req = mockRequest({
      body: {
        planName: "Gold Plan",
        duration: { value: 12, unit: "months" },
        interestRate: 10,
        maxLoanAmount: 5000,
        minLoanAmount: 10000, // min > max
      },
    });
    const res = mockResponse();

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 400 if plan name already exists", async () => {
    Plan.findOne.mockResolvedValue({ planName: "Gold Plan" });

    const req = mockRequest({
      body: {
        planName: "Gold Plan",
        duration: { value: 12, unit: "months" },
        interestRate: 10,
        maxLoanAmount: 50000,
        minLoanAmount: 1000,
      },
    });
    const res = mockResponse();

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Plan with this name already exists" })
    );
  });

  test("should create a plan and return 201", async () => {
    Plan.findOne.mockResolvedValue(null);
    const saveMock = jest.fn().mockResolvedValue(true);
    const planInstance = { planName: "Gold Plan", save: saveMock };
    Plan.mockImplementation(() => planInstance);

    const req = mockRequest({
      body: {
        planName: "Gold Plan",
        duration: { value: 12, unit: "months" },
        interestRate: 10,
        maxLoanAmount: 50000,
        minLoanAmount: 1000,
      },
    });
    const res = mockResponse();

    await createPlan(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Loan plan created successfully" })
    );
  });
});

// ─── getAllPlans ──────────────────────────────────────────────────────────────
describe("getAllPlans", () => {
  test("should return 200 with all plans", async () => {
    const mockPlans = [
      { _id: "1", planName: "Gold Plan" },
      { _id: "2", planName: "Silver Plan" },
    ];
    Plan.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockPlans) });

    const req = mockRequest({ query: {} });
    const res = mockResponse();

    await getAllPlans(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

// ─── getActivePlans ───────────────────────────────────────────────────────────
describe("getActivePlans", () => {
  test("should return only active plans", async () => {
    const mockPlans = [{ _id: "1", planName: "Gold Plan", isActive: true }];
    Plan.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockPlans) });

    const req = mockRequest();
    const res = mockResponse();

    await getActivePlans(req, res);

    expect(Plan.find).toHaveBeenCalledWith({ isActive: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── getPlanById ──────────────────────────────────────────────────────────────
describe("getPlanById", () => {
  test("should return 400 if ID is invalid", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "invalid-id" } });
    const res = mockResponse();

    await getPlanById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid plan ID" })
    );
  });

  test("should return 404 if plan not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await getPlanById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 200 with plan data", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findById.mockResolvedValue({ _id: validId, planName: "Gold Plan" });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await getPlanById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});

// ─── updatePlan ───────────────────────────────────────────────────────────────
describe("updatePlan", () => {
  test("should return 400 if ID is invalid", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" }, body: {} });
    const res = mockResponse();

    await updatePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if plan not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId }, body: { planName: "Updated" } });
    const res = mockResponse();

    await updatePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should update plan and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findByIdAndUpdate.mockResolvedValue({ _id: validId, planName: "Updated Plan" });

    const req = mockRequest({ params: { id: validId }, body: { planName: "Updated Plan" } });
    const res = mockResponse();

    await updatePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Plan updated successfully" })
    );
  });
});

// ─── togglePlanStatus ─────────────────────────────────────────────────────────
describe("togglePlanStatus", () => {
  test("should toggle isActive and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockPlan = { _id: validId, isActive: false, updatedAt: null, save: saveMock };
    Plan.findById.mockResolvedValue(mockPlan);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await togglePlanStatus(req, res);

    expect(mockPlan.isActive).toBe(true);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Plan activated successfully" })
    );
  });
});

// ─── deletePlan ───────────────────────────────────────────────────────────────
describe("deletePlan", () => {
  test("should return 404 if plan does not exist", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findByIdAndDelete.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deletePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should delete plan and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findByIdAndDelete.mockResolvedValue({ _id: validId });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deletePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Plan deleted successfully" })
    );
  });
});

// ─── calculateEMI ─────────────────────────────────────────────────────────────
describe("calculateEMI", () => {
  test("should return 400 if loan amount is invalid", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({ params: { id: validId }, body: { loanAmount: -100 } });
    const res = mockResponse();

    await calculateEMI(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if plan not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId }, body: { loanAmount: 10000 } });
    const res = mockResponse();

    await calculateEMI(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 400 if loan amount is outside plan range", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findById.mockResolvedValue({
      _id: validId,
      planName: "Gold",
      minLoanAmount: 1000,
      maxLoanAmount: 50000,
      interestRate: 10,
      interestType: "flat",
      duration: { value: 12, unit: "months" },
      paymentFrequency: "monthly",
    });

    const req = mockRequest({ params: { id: validId }, body: { loanAmount: 99999 } }); // over max
    const res = mockResponse();

    await calculateEMI(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 200 with correct EMI calculation for flat interest", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Plan.findById.mockResolvedValue({
      _id: validId,
      planName: "Gold",
      minLoanAmount: 1000,
      maxLoanAmount: 50000,
      interestRate: 10,
      interestType: "flat",
      duration: { value: 12, unit: "months" },
      paymentFrequency: "monthly",
      latePenalty: 5,
    });

    const req = mockRequest({ params: { id: validId }, body: { loanAmount: 10000 } });
    const res = mockResponse();

    await calculateEMI(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.calculation.emiAmount).toBeCloseTo(916.67, 1);
  });
});

