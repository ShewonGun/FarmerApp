// tests/course/progressController.test.js
// Unit tests for progressController: submitQuizAttempt, getUserQuizAttempts,
// getQuizAttemptById, getUserCourseQuizAttempts

import {
  submitQuizAttempt,
  getUserQuizAttempts,
  getQuizAttemptById,
  getUserCourseQuizAttempts,
} from "../../../controllers/courseControllers/progressController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/course/Progress.js");
jest.mock("../../../models/course/Quiz.js");
jest.mock("../../../models/course/Question.js");
jest.mock("../../../models/course/Lesson.js");
jest.mock("../../../models/course/Enroll.js");
jest.mock("../../../models/course/Course.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Progress from "../../../models/course/Progress.js";
import Quiz from "../../../models/course/Quiz.js";
import Question from "../../../models/course/Question.js";
import Lesson from "../../../models/course/Lesson.js";
import Enroll from "../../../models/course/Enroll.js";
import mongoose from "mongoose";

const validUserId  = "507f1f77bcf86cd799439011";
const validQuizId  = "507f1f77bcf86cd799439012";
const validAttemptId = "507f1f77bcf86cd799439013";
const validCourseId  = "507f1f77bcf86cd799439014";

// ─── submitQuizAttempt ────────────────────────────────────────────────────────
describe("submitQuizAttempt", () => {
  test("should return 400 for invalid user or quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad", quizId: "bad" }, body: { answers: [] } });
    const res = mockResponse();

    await submitQuizAttempt(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid user or quiz ID" })
    );
  });

  test("should return 400 if answers array is missing or empty", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({ params: { userId: validUserId, quizId: validQuizId }, body: { answers: [] } });
    const res = mockResponse();

    await submitQuizAttempt(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Answers array is required" })
    );
  });

  test("should return 404 if quiz not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const req = mockRequest({
      params: { userId: validUserId, quizId: validQuizId },
      body: { answers: [{ questionId: "q1", selectedChoiceId: "c1" }] },
    });
    const res = mockResponse();

    await submitQuizAttempt(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found" })
    );
  });

  test("should return 400 if quiz has no questions", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: validQuizId, passingScore: 70, lesson: "lesson1" }),
    });
    Question.find.mockResolvedValue([]); // no questions

    const req = mockRequest({
      params: { userId: validUserId, quizId: validQuizId },
      body: { answers: [{ questionId: "q1", selectedChoiceId: "c1" }] },
    });
    const res = mockResponse();

    await submitQuizAttempt(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz has no questions" })
    );
  });

  test("should submit attempt, calculate score/pass, and return 201", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const choiceId = "choice1";
    const questionId = "question1";

    Quiz.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: validQuizId,
        passingScore: 70,
        lesson: { _id: "lesson1", course: validCourseId },
      }),
    });

    const choiceMock = { _id: choiceId, isCorrect: true };
    const questionMock = {
      _id: { toString: () => questionId },
      choices: { id: jest.fn().mockReturnValue(choiceMock) },
    };
    Question.find.mockResolvedValue([questionMock]);

    Lesson.findById.mockResolvedValue({ _id: "lesson1", course: validCourseId });

    const saveMock = jest.fn().mockResolvedValue(true);
    const progressInstance = { _id: validAttemptId, save: saveMock, attemptedAt: new Date() };
    Progress.mockImplementation(() => progressInstance);

    const enrollMock = {
      completedQuizzes: [],
      completedAt: null,
      save: jest.fn().mockResolvedValue(true),
      push: jest.fn(),
    };
    enrollMock.completedQuizzes.includes = jest.fn().mockReturnValue(false);
    Enroll.findOne.mockResolvedValue(enrollMock);

    Progress.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

    const req = mockRequest({
      params: { userId: validUserId, quizId: validQuizId },
      body: { answers: [{ questionId, selectedChoiceId: choiceId }] },
    });
    const res = mockResponse();

    await submitQuizAttempt(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        results: expect.objectContaining({ percentage: 100, passed: true }),
      })
    );
  });
});

// ─── getUserQuizAttempts ──────────────────────────────────────────────────────
describe("getUserQuizAttempts", () => {
  test("should return 400 for invalid user or quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad", quizId: "bad" } });
    const res = mockResponse();

    await getUserQuizAttempts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid user or quiz ID" })
    );
  });

  test("should return 200 with list of attempts", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockAttempts = [
      { _id: validAttemptId, percentage: 80, passed: true },
    ];
    Progress.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockAttempts) }),
    });

    const req = mockRequest({ params: { userId: validUserId, quizId: validQuizId } });
    const res = mockResponse();

    await getUserQuizAttempts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 1, attempts: mockAttempts })
    );
  });
});

// ─── getQuizAttemptById ───────────────────────────────────────────────────────
describe("getQuizAttemptById", () => {
  test("should return 400 for invalid attempt ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { attemptId: "bad-id" } });
    const res = mockResponse();

    await getQuizAttemptById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid attempt ID" })
    );
  });

  test("should return 404 if attempt not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Progress.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    });
    // Make the last populate return null (attempt not found)
    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(null);
    Progress.findById.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { attemptId: validAttemptId } });
    const res = mockResponse();

    await getQuizAttemptById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Progress record not found" })
    );
  });

  test("should return 200 with attempt details", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockAttempt = { _id: validAttemptId, percentage: 85, passed: true };

    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(mockAttempt);
    Progress.findById.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { attemptId: validAttemptId } });
    const res = mockResponse();

    await getQuizAttemptById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, attempt: mockAttempt })
    );
  });
});

// ─── getUserCourseQuizAttempts ────────────────────────────────────────────────
describe("getUserCourseQuizAttempts", () => {
  test("should return 400 for invalid user or course ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad", courseId: "bad" } });
    const res = mockResponse();

    await getUserCourseQuizAttempts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid user or course ID" })
    );
  });

  test("should return 200 with all quiz attempts for the course", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockAttempts = [
      { _id: "a1", percentage: 90, passed: true },
      { _id: "a2", percentage: 60, passed: false },
    ];

    const selectMock = jest.fn().mockResolvedValue(mockAttempts);
    const sortMock = jest.fn().mockReturnValue({ select: selectMock });
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    Progress.find.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await getUserCourseQuizAttempts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

