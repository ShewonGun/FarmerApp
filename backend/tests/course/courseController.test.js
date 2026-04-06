// tests/course/courseController.test.js
// Unit tests for courseController: addCourse, getAllCourses, getCourseById,
// updateCourse, deleteCourse, enrollInCourse, getEnrolledCourses

import {
  addCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollUserInCourse,
  getUserEnrollments,
} from "../../controllers/courseControllers/courseController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../models/course/Course.js");
jest.mock("../../models/course/Lesson.js");
jest.mock("../../models/course/Quiz.js");
jest.mock("../../models/course/Question.js");
jest.mock("../../models/course/Enroll.js");
jest.mock("../../models/course/Progress.js");
jest.mock("../../models/user/User.js");

import Lesson from "../../models/course/Lesson.js";
import Quiz from "../../models/course/Quiz.js";
import Question from "../../models/course/Question.js";
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Course from "../../models/course/Course.js";
import Enroll from "../../models/course/Enroll.js";
import User from "../../models/user/User.js";
import mongoose from "mongoose";

// ─── addCourse ────────────────────────────────────────────────────────────────
describe("addCourse", () => {
  test("should create a course and return 201", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const courseInstance = { _id: "course1", title: "Rice Farming 101", save: saveMock };
    Course.mockImplementation(() => courseInstance);

    const req = mockRequest({
      body: { title: "Rice Farming 101", description: "Learn rice farming", isPublished: true },
    });
    const res = mockResponse();

    await addCourse(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, course: courseInstance })
    );
  });

  test("should return 500 on server error", async () => {
    Course.mockImplementation(() => {
      throw new Error("DB error");
    });

    const req = mockRequest({ body: { title: "Test" } });
    const res = mockResponse();

    await addCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getAllCourses ─────────────────────────────────────────────────────────────
describe("getAllCourses", () => {
  test("should return 200 with paginated courses", async () => {
    const mockCourses = [{ _id: "c1", title: "Rice Farming", toObject: () => ({ _id: "c1", title: "Rice Farming" }) }];
    Course.find.mockReturnValue({
      skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(mockCourses) }),
    });
    Course.countDocuments.mockResolvedValue(1);
    Enroll.countDocuments.mockResolvedValue(5);

    const req = mockRequest({ query: { page: "1", limit: "10" } });
    const res = mockResponse();

    await getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.pagination.totalCourses).toBe(1);
  });
});

// ─── getCourseById ────────────────────────────────────────────────────────────
describe("getCourseById", () => {
  test("should return 404 if course not found", async () => {
    Course.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "nonexistent" } });
    const res = mockResponse();

    await getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 200 with course data", async () => {
    Course.findById.mockResolvedValue({ _id: "c1", title: "Rice Farming", toObject: () => ({ _id: "c1", title: "Rice Farming" }) });
    Enroll.countDocuments.mockResolvedValue(10);

    const req = mockRequest({ params: { id: "c1" } });
    const res = mockResponse();

    await getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});

// ─── updateCourse ─────────────────────────────────────────────────────────────
describe("updateCourse", () => {
  test("should return 404 if course not found", async () => {
    Course.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "c1" }, body: { title: "Updated" } });
    const res = mockResponse();

    await updateCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 200 on success", async () => {
    Course.findByIdAndUpdate.mockResolvedValue({ _id: "c1", title: "Updated Rice Farming" });

    const req = mockRequest({ params: { id: "c1" }, body: { title: "Updated Rice Farming" } });
    const res = mockResponse();

    await updateCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});

// ─── deleteCourse ─────────────────────────────────────────────────────────────
describe("deleteCourse", () => {
  test("should return 404 if course not found", async () => {
    Course.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: "nonexistent" } });
    const res = mockResponse();

    await deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should delete course and all related data, return 200", async () => {
    Course.findById.mockResolvedValue({ _id: "c1", title: "Rice Farming" });
    Lesson.find.mockResolvedValue([]);
    Quiz.find.mockResolvedValue([]);
    Question.deleteMany.mockResolvedValue({});
    Quiz.deleteMany.mockResolvedValue({});
    Lesson.deleteMany.mockResolvedValue({});
    Enroll.deleteMany.mockResolvedValue({});
    Course.findByIdAndDelete.mockResolvedValue({ _id: "c1" });

    const req = mockRequest({ params: { id: "c1" } });
    const res = mockResponse();

    await deleteCourse(req, res);

    expect(Course.findByIdAndDelete).toHaveBeenCalledWith("c1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Course and all related data deleted successfully" })
    );
  });
});

// ─── enrollUserInCourse ───────────────────────────────────────────────────────
describe("enrollUserInCourse", () => {
  test("should return 404 if user not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: "u1", courseId: "c1" } });
    const res = mockResponse();

    await enrollUserInCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  test("should return 404 if course not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: "u1" });
    Course.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: "u1", courseId: "nonexistent" } });
    const res = mockResponse();

    await enrollUserInCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Course not found" })
    );
  });

  test("should return 400 if already enrolled", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: "u1" });
    Course.findById.mockResolvedValue({ _id: "c1", title: "Rice Farming" });
    Enroll.findOne.mockResolvedValue({ _id: "e1" });

    const req = mockRequest({ params: { userId: "u1", courseId: "c1" } });
    const res = mockResponse();

    await enrollUserInCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User is already enrolled in this course" })
    );
  });

  test("should enroll and return 201", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: "u1" });
    Course.findById.mockResolvedValue({ _id: "c1", title: "Rice Farming" });
    Enroll.findOne.mockResolvedValue(null);

    const populateMock = jest.fn().mockResolvedValue(true);
    const saveMock = jest.fn().mockResolvedValue(true);
    const enrollInstance = { _id: "e1", course: "c1", user: "u1", save: saveMock, populate: populateMock };
    Enroll.mockImplementation(() => enrollInstance);

    const req = mockRequest({ params: { userId: "u1", courseId: "c1" } });
    const res = mockResponse();

    await enrollUserInCourse(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ─── getUserEnrollments ───────────────────────────────────────────────────────
describe("getUserEnrollments", () => {
  test("should return 400 if user ID is invalid", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad-id" } });
    const res = mockResponse();

    await getUserEnrollments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 200 with enrolled courses", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockEnrollments = [
      { course: { _id: "c1", title: "Rice Farming" }, progress: 50 },
    ];
    Enroll.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockEnrollments),
    });

    const req = mockRequest({ params: { userId: "u1" } });
    const res = mockResponse();

    await getUserEnrollments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 1 })
    );
  });
});
