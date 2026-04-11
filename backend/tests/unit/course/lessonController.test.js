// tests/course/lessonController.test.js
// Unit tests for lessonController: addLesson, getLessonsByCourse, getLessonById, updateLesson, deleteLesson

import {
  addLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson,
} from "../../../controllers/courseControllers/lessonController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/course/Course.js");
jest.mock("../../../models/course/Lesson.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Course from "../../../models/course/Course.js";
import Lesson from "../../../models/course/Lesson.js";
import mongoose from "mongoose";

const validId = "507f1f77bcf86cd799439011";

// ─── addLesson ────────────────────────────────────────────────────────────────
describe("addLesson", () => {
  test("should return 400 for invalid course ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { courseId: "bad-id" }, body: {} });
    const res = mockResponse();

    await addLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid course ID" })
    );
  });

  test("should return 400 if title or content is missing", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({ params: { courseId: validId }, body: { title: "Lesson 1" } }); // missing content
    const res = mockResponse();

    await addLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Title and content are required" })
    );
  });

  test("should return 404 if course not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Course.findById.mockResolvedValue(null);

    const req = mockRequest({
      params: { courseId: validId },
      body: { title: "Lesson 1", content: "Introduction" },
    });
    const res = mockResponse();

    await addLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Course not found" })
    );
  });

  test("should create lesson and return 201", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const saveCourse = jest.fn().mockResolvedValue(true);
    Course.findById.mockResolvedValue({ _id: validId, noOfLessons: 0, save: saveCourse });

    const saveLesson = jest.fn().mockResolvedValue(true);
    const lessonInstance = { _id: "lesson1", title: "Lesson 1", save: saveLesson };
    Lesson.mockImplementation(() => lessonInstance);

    const req = mockRequest({
      params: { courseId: validId },
      body: { title: "Lesson 1", content: "Introduction", youtubeUrl: "https://youtube.com/watch?v=abc123" },
    });
    const res = mockResponse();

    await addLesson(req, res);

    expect(saveLesson).toHaveBeenCalled();
    expect(saveCourse).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, lesson: lessonInstance })
    );
  });
});

// ─── getLessonsByCourse ───────────────────────────────────────────────────────
describe("getLessonsByCourse", () => {
  test("should return 400 for invalid course ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { courseId: "bad-id" } });
    const res = mockResponse();

    await getLessonsByCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 200 with lessons for the course", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockLessons = [
      { _id: "l1", title: "Intro to Rice Farming" },
      { _id: "l2", title: "Soil Preparation" },
    ];
    Lesson.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockLessons) });

    const req = mockRequest({ params: { courseId: validId } });
    const res = mockResponse();

    await getLessonsByCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, lessons: mockLessons })
    );
  });
});

// ─── getLessonById ────────────────────────────────────────────────────────────
describe("getLessonById", () => {
  test("should return 400 for invalid lesson ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "invalid" } });
    const res = mockResponse();

    await getLessonById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if lesson not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await getLessonById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Lesson not found" })
    );
  });

  test("should return 200 with lesson data", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findById.mockResolvedValue({ _id: validId, title: "Intro to Rice Farming" });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await getLessonById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ─── updateLesson ─────────────────────────────────────────────────────────────
describe("updateLesson", () => {
  test("should return 400 for invalid lesson ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" }, body: { title: "Updated" } });
    const res = mockResponse();

    await updateLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if lesson not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId }, body: { title: "Updated" } });
    const res = mockResponse();

    await updateLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Lesson not found" })
    );
  });

  test("should update lesson and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findByIdAndUpdate.mockResolvedValue({ _id: validId, title: "Updated Lesson" });

    const req = mockRequest({ params: { id: validId }, body: { title: "Updated Lesson" } });
    const res = mockResponse();

    await updateLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ─── deleteLesson ─────────────────────────────────────────────────────────────
describe("deleteLesson", () => {
  test("should return 400 for invalid lesson ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" } });
    const res = mockResponse();

    await deleteLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if lesson not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findByIdAndDelete.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Lesson not found" })
    );
  });

  test("should delete lesson, decrement course count, and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findByIdAndDelete.mockResolvedValue({ _id: validId, course: "course1" });
    Course.findByIdAndUpdate.mockResolvedValue({ _id: "course1", noOfLessons: 4 });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteLesson(req, res);

    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith("course1", { $inc: { noOfLessons: -1 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Lesson deleted successfully" })
    );
  });
});

