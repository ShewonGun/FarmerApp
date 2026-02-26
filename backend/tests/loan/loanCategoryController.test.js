// tests/loan/loanCategoryController.test.js
// Unit tests for loanCategoryController: CRUD operations

import {
  createLoanCategory,
  getAllLoanCategories,
  getLoanCategoryById,
  updateLoanCategory,
  deleteLoanCategory,
} from "../../controllers/loanControllers/loanCategoryController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../models/loan/LoanCategory.js");
import LoanCategory from "../../models/loan/LoanCategory.js";

// ─── createLoanCategory ───────────────────────────────────────────────────────
describe("createLoanCategory", () => {
  test("should return 400 if category already exists", async () => {
    LoanCategory.findOne.mockResolvedValue({ name: "Crop Loan" });

    const req = mockRequest({ body: { name: "Crop Loan", interestRate: 10, maxAmount: 50000 } });
    const res = mockResponse();

    await createLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Category already exists" })
    );
  });

  test("should create a new category and return 201", async () => {
    LoanCategory.findOne.mockResolvedValue(null);

    const saveMock = jest.fn().mockResolvedValue(true);
    const categoryInstance = { name: "Crop Loan", interestRate: 10, maxAmount: 50000, save: saveMock };
    LoanCategory.mockImplementation(() => categoryInstance);

    const req = mockRequest({ body: { name: "Crop Loan", interestRate: 10, maxAmount: 50000 } });
    const res = mockResponse();

    await createLoanCategory(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Loan category created successfully" })
    );
  });
});

// ─── getAllLoanCategories ─────────────────────────────────────────────────────
describe("getAllLoanCategories", () => {
  test("should return 200 with all categories", async () => {
    const mockCategories = [
      { _id: "1", name: "Crop Loan" },
      { _id: "2", name: "Equipment Loan" },
    ];
    LoanCategory.find.mockResolvedValue(mockCategories);

    const req = mockRequest();
    const res = mockResponse();

    await getAllLoanCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCategories);
  });

  test("should return 500 on server error", async () => {
    LoanCategory.find.mockRejectedValue(new Error("DB error"));

    const req = mockRequest();
    const res = mockResponse();

    await getAllLoanCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getLoanCategoryById ──────────────────────────────────────────────────────
describe("getLoanCategoryById", () => {
  test("should return 404 if category not found", async () => {
    LoanCategory.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "nonexistent" } });
    const res = mockResponse();

    await getLoanCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Category not found" })
    );
  });

  test("should return 200 with category data", async () => {
    const mockCategory = { _id: "1", name: "Crop Loan" };
    LoanCategory.findById.mockResolvedValue(mockCategory);

    const req = mockRequest({ params: { id: "1" } });
    const res = mockResponse();

    await getLoanCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCategory);
  });
});

// ─── updateLoanCategory ───────────────────────────────────────────────────────
describe("updateLoanCategory", () => {
  test("should return 404 if category does not exist", async () => {
    LoanCategory.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({
      params: { id: "nonexistent" },
      body: { name: "New Name", interestRate: 12, maxAmount: 60000 },
    });
    const res = mockResponse();

    await updateLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should update category and return 200", async () => {
    const updated = { _id: "1", name: "New Name", interestRate: 12, maxAmount: 60000 };
    LoanCategory.findByIdAndUpdate.mockResolvedValue(updated);

    const req = mockRequest({
      params: { id: "1" },
      body: { name: "New Name", interestRate: 12, maxAmount: 60000 },
    });
    const res = mockResponse();

    await updateLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Category updated successfully" })
    );
  });
});

// ─── deleteLoanCategory ───────────────────────────────────────────────────────
describe("deleteLoanCategory", () => {
  test("should return 404 if category does not exist", async () => {
    LoanCategory.findByIdAndDelete.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "nonexistent" } });
    const res = mockResponse();

    await deleteLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should delete category and return 200", async () => {
    LoanCategory.findByIdAndDelete.mockResolvedValue({ _id: "1" });

    const req = mockRequest({ params: { id: "1" } });
    const res = mockResponse();

    await deleteLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Category deleted successfully" })
    );
  });
});
