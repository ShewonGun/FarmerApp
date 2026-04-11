// tests/support/platformServiceRatingController.test.js
// Unit tests for platformServiceRatingController: createPlatformRating,
// getMyPlatformRating, getPlatformRatingByUser, getAllPlatformRatings

import {
  createPlatformRating,
  getMyPlatformRating,
  getPlatformRatingByUser,
  getAllPlatformRatings,
} from "../../../controllers/SupportControllers/platformServiceRatingController.js";
import { mockRequest, mockResponse } from "../../setup.js";

jest.mock("../../../models/Support/PlatformServiceRating.js");

import PlatformServiceRating from "../../../models/Support/PlatformServiceRating.js";

const userId = "507f1f77bcf86cd799439011";

// ─── createPlatformRating ─────────────────────────────────────────────────────
describe("createPlatformRating", () => {
  test("should return 400 if user has already submitted a rating", async () => {
    PlatformServiceRating.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockRequest({ user: { _id: userId }, body: { rating: 5 } });
    const res = mockResponse();

    await createPlatformRating(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You have already submitted a platform rating" })
    );
  });

  test("should create rating and return 201", async () => {
    PlatformServiceRating.findOne.mockResolvedValue(null);
    const mockRating = { _id: "r1", userId, rating: 4, comment: "Good platform" };
    PlatformServiceRating.create.mockResolvedValue(mockRating);

    const req = mockRequest({
      user: { _id: userId },
      body: { rating: 4, comment: "Good platform" },
    });
    const res = mockResponse();

    await createPlatformRating(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockRating })
    );
  });
});

// ─── getMyPlatformRating ─────────────────────────────────────────────────────
describe("getMyPlatformRating", () => {
  test("should return 404 if user has no rating", async () => {
    PlatformServiceRating.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyPlatformRating(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You have not submitted a platform rating" })
    );
  });

  test("should return 200 with the user's rating", async () => {
    const mockRating = { _id: "r1", userId, rating: 5 };
    PlatformServiceRating.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRating),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyPlatformRating(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockRating })
    );
  });
});

// ─── getPlatformRatingByUser ──────────────────────────────────────────────────
describe("getPlatformRatingByUser", () => {
  test("should return 404 if no rating found for given user ID", async () => {
    PlatformServiceRating.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await getPlatformRatingByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 200 with the rating for the user", async () => {
    const mockRating = { _id: "r1", userId, rating: 3 };
    PlatformServiceRating.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRating),
    });

    const req = mockRequest({ params: { userId } });
    const res = mockResponse();

    await getPlatformRatingByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockRating })
    );
  });
});

// ─── getAllPlatformRatings ────────────────────────────────────────────────────
describe("getAllPlatformRatings", () => {
  test("should return 200 with all ratings", async () => {
    const mockRatings = [{ _id: "r1", rating: 5 }, { _id: "r2", rating: 4 }];
    PlatformServiceRating.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockRatings) }),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllPlatformRatings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

