// tests/user/locationFarmingController.test.js
import {
  createLocationFarming,
  getMyLocationFarming,
  getAllLocationFarmings,
  updateLocationFarming,
  deleteLocationFarming,
} from "../../../controllers/userControllers/locationFarmingController.js";
import { mockRequest, mockResponse } from "../../setup.js";

jest.mock("../../../models/user/LocationFarming.js");

import UserFarmingLocation from "../../../models/user/LocationFarming.js";

const userId = "507f1f77bcf86cd799439011";

// ─── createLocationFarming ────────────────────────────────────────────────────
describe("createLocationFarming", () => {
  test("should return 400 if record already exists", async () => {
    UserFarmingLocation.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockRequest({ user: { _id: userId }, body: { region: "Ashanti" } });
    const res = mockResponse();

    await createLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Location & farming info already exists for this user" })
    );
  });

  test("should create record and return 201", async () => {
    UserFarmingLocation.findOne.mockResolvedValue(null);
    const mockData = { _id: "lf1", userId, region: "Ashanti" };
    UserFarmingLocation.create.mockResolvedValue(mockData);

    const req = mockRequest({ user: { _id: userId }, body: { region: "Ashanti" } });
    const res = mockResponse();

    await createLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getMyLocationFarming ─────────────────────────────────────────────────────
describe("getMyLocationFarming", () => {
  test("should return 404 if record not found", async () => {
    UserFarmingLocation.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Location & farming info not found" })
    );
  });

  test("should return 200 with the record", async () => {
    const mockData = { _id: "lf1", userId, region: "Ashanti" };
    UserFarmingLocation.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockData })
    );
  });
});

// ─── getAllLocationFarmings ───────────────────────────────────────────────────
describe("getAllLocationFarmings", () => {
  test("should return 200 with all records", async () => {
    const mockData = [{ _id: "lf1" }, { _id: "lf2" }];
    UserFarmingLocation.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllLocationFarmings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2, data: mockData })
    );
  });
});

// ─── updateLocationFarming ────────────────────────────────────────────────────
describe("updateLocationFarming", () => {
  test("should return 404 if record not found", async () => {
    UserFarmingLocation.findOneAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId }, body: { region: "Northern" } });
    const res = mockResponse();

    await updateLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Location & farming info not found" })
    );
  });

  test("should update and return 200", async () => {
    const mockUpdated = { _id: "lf1", userId, region: "Northern" };
    UserFarmingLocation.findOneAndUpdate.mockResolvedValue(mockUpdated);

    const req = mockRequest({ user: { _id: userId }, body: { region: "Northern" } });
    const res = mockResponse();

    await updateLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockUpdated })
    );
  });
});

// ─── deleteLocationFarming ────────────────────────────────────────────────────
describe("deleteLocationFarming", () => {
  test("should return 404 if record not found", async () => {
    UserFarmingLocation.findOneAndDelete.mockResolvedValue(null);

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Location & farming info not found" })
    );
  });

  test("should delete and return 200", async () => {
    UserFarmingLocation.findOneAndDelete.mockResolvedValue({ _id: "lf1" });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await deleteLocationFarming(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Location & farming info deleted successfully" })
    );
  });
});

