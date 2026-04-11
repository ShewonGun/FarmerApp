// tests/user/trainingEngagementController.test.js
import {
  createTrainingEngagement,
  getMyTrainingEngagement,
  getAllTrainingEngagements,
  updateTrainingEngagement,
  deleteTrainingEngagement,
} from "../../../controllers/userControllers/trainingEngagementController.js";
import { mockRequest, mockResponse } from "../../setup.js";

jest.mock("../../../models/user/TrainingEngagement.js");

import UserEngagement from "../../../models/user/TrainingEngagement.js";

const userId = "507f1f77bcf86cd799439011";

// ─── createTrainingEngagement ─────────────────────────────────────────────────
describe("createTrainingEngagement", () => {
  test("should return 400 if record already exists", async () => {
    UserEngagement.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockRequest({ user: { _id: userId }, body: { trainingLevel: "Basic" } });
    const res = mockResponse();

    await createTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Training & engagement info already exists for this user" })
    );
  });

  test("should create record and return 201", async () => {
    UserEngagement.findOne.mockResolvedValue(null);
    const mockData = { _id: "te1", userId, trainingLevel: "Basic" };
    UserEngagement.create.mockResolvedValue(mockData);

    const req = mockRequest({ user: { _id: userId }, body: { trainingLevel: "Basic" } });
    const res = mockResponse();

    await createTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getMyTrainingEngagement ──────────────────────────────────────────────────
describe("getMyTrainingEngagement", () => {
  test("should return 404 if record not found", async () => {
    UserEngagement.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Training & engagement info not found" })
    );
  });

  test("should return 200 with the record", async () => {
    const mockData = { _id: "te1", userId, trainingLevel: "Advanced" };
    UserEngagement.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getAllTrainingEngagements ────────────────────────────────────────────────
describe("getAllTrainingEngagements", () => {
  test("should return 200 with all records", async () => {
    const mockData = [{ _id: "te1" }, { _id: "te2" }, { _id: "te3" }];
    UserEngagement.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllTrainingEngagements(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 3, data: mockData })
    );
  });
});

// ─── updateTrainingEngagement ─────────────────────────────────────────────────
describe("updateTrainingEngagement", () => {
  test("should return 404 if record not found", async () => {
    UserEngagement.findOneAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId }, body: { trainingLevel: "Intermediate" } });
    const res = mockResponse();

    await updateTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Training & engagement info not found" })
    );
  });

  test("should update and return 200", async () => {
    const mockUpdated = { _id: "te1", userId, trainingLevel: "Intermediate" };
    UserEngagement.findOneAndUpdate.mockResolvedValue(mockUpdated);

    const req = mockRequest({ user: { _id: userId }, body: { trainingLevel: "Intermediate" } });
    const res = mockResponse();

    await updateTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockUpdated })
    );
  });
});

// ─── deleteTrainingEngagement ─────────────────────────────────────────────────
describe("deleteTrainingEngagement", () => {
  test("should return 404 if record not found", async () => {
    UserEngagement.findOneAndDelete.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Training & engagement info not found" })
    );
  });

  test("should delete and return 200", async () => {
    UserEngagement.findOneAndDelete.mockResolvedValue({ _id: "te1" });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteTrainingEngagement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Training & engagement info deleted successfully" })
    );
  });
});

