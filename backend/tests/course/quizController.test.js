// tests/course/quizController.test.js
// Unit tests for quizController: addQuiz, getQuizByLesson, updateQuiz, deleteQuiz

import {
  addQuiz,
  getQuizByLesson,
  updateQuiz,
  deleteQuiz,
} from "../../controllers/courseControllers/quizController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../models/course/Quiz.js");
jest.mock("../../models/course/Question.js");
jest.mock("../../models/course/Lesson.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Quiz from "../../models/course/Quiz.js";
import Question from "../../models/course/Question.js";
import Lesson from "../../models/course/Lesson.js";
import mongoose from "mongoose";

const validId = "507f1f77bcf86cd799439011";

// ─── addQuiz ──────────────────────────────────────────────────────────────────
describe("addQuiz", () => {
  test("should return 400 for invalid lesson ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { lessonId: "bad-id" }, body: { title: "Quiz 1" } });
    const res = mockResponse();

    await addQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid lesson ID" })
    );
  });

  test("should return 400 if title is missing", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({ params: { lessonId: validId }, body: {} });
    const res = mockResponse();

    await addQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Title is required" })
    );
  });

  test("should return 404 if lesson not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Lesson.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { lessonId: validId }, body: { title: "Quiz 1" } });
    const res = mockResponse();

    await addQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Lesson not found" })
    );
  });

  test("should create quiz and return 201", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const saveLesson = jest.fn().mockResolvedValue(true);
    Lesson.findById.mockResolvedValue({ _id: validId, isQuizAvailable: false, save: saveLesson });

    const saveQuiz = jest.fn().mockResolvedValue(true);
    const quizInstance = { _id: "quiz1", title: "Quiz 1", passingScore: 70, save: saveQuiz };
    Quiz.mockImplementation(() => quizInstance);

    const req = mockRequest({
      params: { lessonId: validId },
      body: { title: "Quiz 1", passingScore: 70 },
    });
    const res = mockResponse();

    await addQuiz(req, res);

    expect(saveQuiz).toHaveBeenCalled();
    expect(saveLesson).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, quiz: quizInstance })
    );
  });
});

// ─── getQuizByLesson ──────────────────────────────────────────────────────────
describe("getQuizByLesson", () => {
  test("should return 400 for invalid lesson ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { lessonId: "bad-id" } });
    const res = mockResponse();

    await getQuizByLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if quiz not found for lesson", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findOne.mockResolvedValue(null);

    const req = mockRequest({ params: { lessonId: validId } });
    const res = mockResponse();

    await getQuizByLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found for this lesson" })
    );
  });

  test("should return 200 with quiz and questions", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockQuiz = { _id: "quiz1", title: "Quiz 1", toObject: () => ({ _id: "quiz1", title: "Quiz 1" }) };
    Quiz.findOne.mockResolvedValue(mockQuiz);

    const mockQuestions = [{ _id: "q1", questionText: "What is soil?" }];
    Question.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockQuestions) });

    const req = mockRequest({ params: { lessonId: validId } });
    const res = mockResponse();

    await getQuizByLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        quiz: expect.objectContaining({ questions: mockQuestions }),
      })
    );
  });
});

// ─── updateQuiz ───────────────────────────────────────────────────────────────
describe("updateQuiz", () => {
  test("should return 400 for invalid quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" }, body: { title: "Updated Quiz" } });
    const res = mockResponse();

    await updateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid quiz ID" })
    );
  });

  test("should return 404 if quiz not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId }, body: { title: "Updated Quiz" } });
    const res = mockResponse();

    await updateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found" })
    );
  });

  test("should update quiz and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findByIdAndUpdate.mockResolvedValue({ _id: validId, title: "Updated Quiz", passingScore: 80 });

    const req = mockRequest({ params: { id: validId }, body: { title: "Updated Quiz", passingScore: 80 } });
    const res = mockResponse();

    await updateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz updated successfully" })
    );
  });
});

// ─── deleteQuiz ───────────────────────────────────────────────────────────────
describe("deleteQuiz", () => {
  test("should return 400 for invalid quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" } });
    const res = mockResponse();

    await deleteQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if quiz not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found" })
    );
  });

  test("should delete quiz, questions, and update lesson, return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const saveLesson = jest.fn().mockResolvedValue(true);
    Quiz.findById.mockResolvedValue({ _id: validId, lesson: "lesson1" });
    Question.deleteMany.mockResolvedValue({});
    Quiz.findByIdAndDelete.mockResolvedValue({ _id: validId });
    Lesson.findById.mockResolvedValue({ _id: "lesson1", isQuizAvailable: true, save: saveLesson });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteQuiz(req, res);

    expect(Question.deleteMany).toHaveBeenCalledWith({ quiz: validId });
    expect(Quiz.findByIdAndDelete).toHaveBeenCalledWith(validId);
    expect(saveLesson).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz deleted successfully" })
    );
  });
});
