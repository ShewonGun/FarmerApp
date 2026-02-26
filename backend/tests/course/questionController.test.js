// tests/course/questionController.test.js
// Unit tests for questionController: addQuestion, getQuestionsByQuiz, updateQuestion, deleteQuestion

import {
  addQuestion,
  getQuestionsByQuiz,
  updateQuestion,
  deleteQuestion,
} from "../../controllers/courseControllers/questionController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../models/course/Question.js");
jest.mock("../../models/course/Quiz.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Question from "../../models/course/Question.js";
import Quiz from "../../models/course/Quiz.js";
import mongoose from "mongoose";

const validId = "507f1f77bcf86cd799439011";

const validChoices = [
  { choiceText: "Nitrogen", isCorrect: true },
  { choiceText: "Carbon", isCorrect: false },
];

// ─── addQuestion ──────────────────────────────────────────────────────────────
describe("addQuestion", () => {
  test("should return 400 for invalid quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { quizId: "bad-id" }, body: {} });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid quiz ID" })
    );
  });

  test("should return 400 if questionText is missing", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({ params: { quizId: validId }, body: { choices: validChoices } });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "questionText is required" })
    );
  });

  test("should return 400 if fewer than 2 choices are provided", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const req = mockRequest({
      params: { quizId: validId },
      body: { questionText: "What is fertilizer?", choices: [{ choiceText: "Nitrogen", isCorrect: true }] },
    });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "At least 2 choices are required" })
    );
  });

  test("should return 400 if no correct answer is marked", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const noCorrectChoices = [
      { choiceText: "Nitrogen", isCorrect: false },
      { choiceText: "Carbon", isCorrect: false },
    ];

    const req = mockRequest({
      params: { quizId: validId },
      body: { questionText: "What is fertilizer?", choices: noCorrectChoices },
    });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "At least one choice must be marked as correct" })
    );
  });

  test("should return 404 if quiz not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockResolvedValue(null);

    const req = mockRequest({
      params: { quizId: validId },
      body: { questionText: "What is fertilizer?", choices: validChoices },
    });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found" })
    );
  });

  test("should create question and return 201", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockResolvedValue({ _id: validId, title: "Quiz 1" });
    Question.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });

    const saveMock = jest.fn().mockResolvedValue(true);
    const questionInstance = { _id: "q1", questionText: "What is fertilizer?", save: saveMock };
    Question.mockImplementation(() => questionInstance);

    const req = mockRequest({
      params: { quizId: validId },
      body: { questionText: "What is fertilizer?", choices: validChoices },
    });
    const res = mockResponse();

    await addQuestion(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, question: questionInstance })
    );
  });
});

// ─── getQuestionsByQuiz ───────────────────────────────────────────────────────
describe("getQuestionsByQuiz", () => {
  test("should return 400 for invalid quiz ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { quizId: "bad-id" } });
    const res = mockResponse();

    await getQuestionsByQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if quiz not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { quizId: validId } });
    const res = mockResponse();

    await getQuestionsByQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz not found" })
    );
  });

  test("should return 200 with all questions", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Quiz.findById.mockResolvedValue({ _id: validId });

    const mockQuestions = [
      { _id: "q1", questionText: "What is soil?" },
      { _id: "q2", questionText: "What is fertilizer?" },
    ];
    Question.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockQuestions) });

    const req = mockRequest({ params: { quizId: validId } });
    const res = mockResponse();

    await getQuestionsByQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2, questions: mockQuestions })
    );
  });
});

// ─── updateQuestion ───────────────────────────────────────────────────────────
describe("updateQuestion", () => {
  test("should return 400 for invalid question ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" }, body: {} });
    const res = mockResponse();

    await updateQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if question not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Question.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId }, body: {} });
    const res = mockResponse();

    await updateQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Question not found" })
    );
  });

  test("should return 400 if updated choices array has fewer than 2 items", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Question.findById.mockResolvedValue({
      _id: validId,
      questionText: "Old question",
      choices: [],
      save: jest.fn(),
    });

    const req = mockRequest({
      params: { id: validId },
      body: { choices: [{ choiceText: "Only one choice", isCorrect: true }] },
    });
    const res = mockResponse();

    await updateQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "At least 2 choices are required" })
    );
  });

  test("should update question and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const saveMock = jest.fn().mockResolvedValue(true);
    Question.findById.mockResolvedValue({
      _id: validId,
      questionText: "Old question",
      choices: [],
      save: saveMock,
    });

    const req = mockRequest({
      params: { id: validId },
      body: { questionText: "Updated question?", choices: validChoices },
    });
    const res = mockResponse();

    await updateQuestion(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Question updated successfully" })
    );
  });
});

// ─── deleteQuestion ───────────────────────────────────────────────────────────
describe("deleteQuestion", () => {
  test("should return 400 for invalid question ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { id: "bad-id" } });
    const res = mockResponse();

    await deleteQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if question not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Question.findByIdAndDelete.mockResolvedValue(null);

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Question not found" })
    );
  });

  test("should delete question and return 200", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Question.findByIdAndDelete.mockResolvedValue({ _id: validId, questionText: "What is soil?" });

    const req = mockRequest({ params: { id: validId } });
    const res = mockResponse();

    await deleteQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Question deleted successfully" })
    );
  });
});
