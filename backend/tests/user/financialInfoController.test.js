// tests/user/financialInfoController.test.js
import {
  createFinancialInfo,
  getMyFinancialInfo,
  getAllFinancialInfos,
  updateFinancialInfo,
  deleteFinancialInfo,
} from "../../controllers/userControllers/financialInfoController.js";
import { mockRequest, mockResponse } from "../setup.js";

jest.mock("../../models/user/FinancialInfo.js");

import UserFinance from "../../models/user/FinancialInfo.js";

const userId = "507f1f77bcf86cd799439011";

// ─── createFinancialInfo ──────────────────────────────────────────────────────
describe("createFinancialInfo", () => {
  test("should return 400 if financial info already exists", async () => {
    UserFinance.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockRequest({ user: { _id: userId }, body: { monthlyIncome: 5000 } });
    const res = mockResponse();

    await createFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Financial info already exists for this user" })
    );
  });

  test("should create financial info and return 201", async () => {
    UserFinance.findOne.mockResolvedValue(null);
    const mockData = { _id: "fi1", userId, monthlyIncome: 5000 };
    UserFinance.create.mockResolvedValue(mockData);

    const req = mockRequest({ user: { _id: userId }, body: { monthlyIncome: 5000 } });
    const res = mockResponse();

    await createFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getMyFinancialInfo ───────────────────────────────────────────────────────
describe("getMyFinancialInfo", () => {
  test("should return 404 if financial info not found", async () => {
    UserFinance.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Financial info not found" })
    );
  });

  test("should return 200 with financial info", async () => {
    const mockData = { _id: "fi1", userId, monthlyIncome: 5000 };
    UserFinance.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getAllFinancialInfos ─────────────────────────────────────────────────────
describe("getAllFinancialInfos", () => {
  test("should return 200 with all records", async () => {
    const mockData = [{ _id: "fi1" }, { _id: "fi2" }];
    UserFinance.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllFinancialInfos(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2, data: mockData })
    );
  });
});

// ─── updateFinancialInfo ──────────────────────────────────────────────────────
describe("updateFinancialInfo", () => {
  test("should return 404 if financial info not found", async () => {
    UserFinance.findOneAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId }, body: { monthlyIncome: 7000 } });
    const res = mockResponse();

    await updateFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Financial info not found" })
    );
  });

  test("should update and return 200", async () => {
    const mockUpdated = { _id: "fi1", userId, monthlyIncome: 7000 };
    UserFinance.findOneAndUpdate.mockResolvedValue(mockUpdated);

    const req = mockRequest({ user: { _id: userId }, body: { monthlyIncome: 7000 } });
    const res = mockResponse();

    await updateFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockUpdated })
    );
  });
});

// ─── deleteFinancialInfo ──────────────────────────────────────────────────────
describe("deleteFinancialInfo", () => {
  test("should return 404 if financial info not found", async () => {
    UserFinance.findOneAndDelete.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Financial info not found" })
    );
  });

  test("should delete and return 200", async () => {
    UserFinance.findOneAndDelete.mockResolvedValue({ _id: "fi1" });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteFinancialInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Financial info deleted successfully" })
    );
  });
});
