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

jest.mock("../../models/loan/LoanCategory.js");
import LoanCategory from "../../models/loan/LoanCategory.js";

describe("createLoanCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if category already exists", async () => {
    LoanCategory.findOne.mockResolvedValueOnce({ name: "Crop Loan" });

    const req = mockRequest({ body: { name: "Crop Loan", code: "CROP" } });
    const res = mockResponse();

    await createLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should create a new category and return 201", async () => {
    LoanCategory.findOne.mockResolvedValue(null);

    const saveMock = jest.fn().mockResolvedValue(true);
    const categoryInstance = {
      name: "Crop Loan",
      code: "CROP",
      description: "Seasonal crop financing",
      isActive: true,
      requiredDocuments: ["NIC", "Land proof"],
      eligiblePurposes: ["Seeds", "Fertilizer"],
      displayOrder: 1,
      save: saveMock,
    };
    LoanCategory.mockImplementation(() => categoryInstance);

    const req = mockRequest({
      body: {
        name: " Crop Loan ",
        code: "crop",
        description: " Seasonal crop financing ",
        isActive: true,
        requiredDocuments: ["NIC", "Land proof", ""],
        eligiblePurposes: ["Seeds", "Fertilizer"],
        displayOrder: 1,
      },
    });
    const res = mockResponse();

    await createLoanCategory(req, res);

    expect(LoanCategory).toHaveBeenCalledWith(expect.objectContaining({
      name: "Crop Loan",
      code: "CROP",
      description: "Seasonal crop financing",
      requiredDocuments: ["NIC", "Land proof"],
    }));
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("getLoanCategoryById", () => {
  test("should return 400 for invalid category ids", async () => {
    const req = mockRequest({ params: { id: "bad-id" } });
    const res = mockResponse();

    await getLoanCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("updateLoanCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 for invalid category ids", async () => {
    const req = mockRequest({ params: { id: "bad-id" }, body: { name: "New Name" } });
    const res = mockResponse();

    await updateLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 400 if category code already exists", async () => {
    LoanCategory.findOne.mockResolvedValue({ _id: "2", code: "CROP" });

    const req = mockRequest({
      params: { id: "507f1f77bcf86cd799439011" },
      body: { code: "crop" },
    });
    const res = mockResponse();

    await updateLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("deleteLoanCategory", () => {
  test("should return 400 for invalid category ids", async () => {
    const req = mockRequest({ params: { id: "bad-id" } });
    const res = mockResponse();

    await deleteLoanCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
