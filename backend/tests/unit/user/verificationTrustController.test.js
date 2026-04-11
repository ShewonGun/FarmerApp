// tests/user/verificationTrustController.test.js
import {
  createVerification,
  getMyVerification,
  getVerificationByUser,
  getAllVerifications,
  updateVerification,
  deleteVerification,
} from "../../../controllers/userControllers/verificationTrustController.js";
import { mockRequest, mockResponse } from "../../setup.js";

jest.mock("../../../models/user/VerificationTrust.js");

import UserTrust from "../../../models/user/VerificationTrust.js";

const userId = "507f1f77bcf86cd799439011";

// ─── createVerification ───────────────────────────────────────────────────────
describe("createVerification", () => {
  test("should return 400 if verification record already exists", async () => {
    UserTrust.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockRequest({ user: { _id: userId }, body: { idType: "GhanaCard" } });
    const res = mockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verification record already exists for this user" })
    );
  });

  test("should create verification and return 201", async () => {
    UserTrust.findOne.mockResolvedValue(null);
    const mockData = { _id: "vt1", userId, idType: "GhanaCard" };
    UserTrust.create.mockResolvedValue(mockData);

    const req = mockRequest({ user: { _id: userId }, body: { idType: "GhanaCard" } });
    const res = mockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getMyVerification ────────────────────────────────────────────────────────
describe("getMyVerification", () => {
  test("should return 404 if verification record not found", async () => {
    UserTrust.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verification record not found" })
    );
  });

  test("should return 200 with verification record", async () => {
    const mockData = { _id: "vt1", userId, idType: "GhanaCard", verificationStatus: "Pending" };
    UserTrust.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getVerificationByUser ────────────────────────────────────────────────────
describe("getVerificationByUser", () => {
  test("should return 404 if record not found for given user ID", async () => {
    UserTrust.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await getVerificationByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verification record not found" })
    );
  });

  test("should return 200 with the verification record", async () => {
    const mockData = { _id: "vt1", userId, verificationStatus: "Verified" };
    UserTrust.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await getVerificationByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getAllVerifications ──────────────────────────────────────────────────────
describe("getAllVerifications", () => {
  test("should return 200 with all verification records", async () => {
    const mockData = [{ _id: "vt1" }, { _id: "vt2" }];
    UserTrust.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockData) }),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllVerifications(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2, data: mockData })
    );
  });
});

// ─── updateVerification ───────────────────────────────────────────────────────
describe("updateVerification", () => {
  test("should return 404 if record not found", async () => {
    UserTrust.findOneAndUpdate.mockResolvedValue(null);

    const req = mockRequest({
      params: { userId },
      body: { verificationStatus: "Rejected" },
    });
    const res = mockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verification record not found" })
    );
  });

  test("should update status and return 200", async () => {
    const mockUpdated = { _id: "vt1", userId, verificationStatus: "Verified" };
    UserTrust.findOneAndUpdate.mockResolvedValue(mockUpdated);

    const req = mockRequest({
      params: { userId },
      body: { verificationStatus: "Verified" },
    });
    const res = mockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockUpdated })
    );
  });

  test("should auto-set verifiedDate when status is Verified", async () => {
    const mockUpdated = { _id: "vt1", userId, verificationStatus: "Verified", verifiedDate: new Date() };
    UserTrust.findOneAndUpdate.mockResolvedValue(mockUpdated);

    const reqBody = { verificationStatus: "Verified" };
    const req = mockRequest({ params: { userId }, body: reqBody });
    const res = mockResponse();

    await updateVerification(req, res);

    // verifiedDate should have been set on req.body before the update call
    expect(reqBody.verifiedDate).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── deleteVerification ───────────────────────────────────────────────────────
describe("deleteVerification", () => {
  test("should return 404 if record not found", async () => {
    UserTrust.findOneAndDelete.mockResolvedValue(null);

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Verification record not found" })
    );
  });

  test("should delete and return 200", async () => {
    UserTrust.findOneAndDelete.mockResolvedValue({ _id: "vt1" });

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Verification record deleted successfully" })
    );
  });
});

