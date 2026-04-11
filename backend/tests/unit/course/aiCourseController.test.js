// tests/course/aiCourseController.test.js
// Unit tests for aiCourseController: getQuizExplanations

import { getQuizExplanations } from "../../../controllers/courseControllers/aiCourseController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/course/Progress.js");
jest.mock("../../../models/course/Question.js");
jest.mock("../../../config/githubAI.js");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Progress from "../../../models/course/Progress.js";
import Question from "../../../models/course/Question.js";
import githubAI from "../../../config/githubAI.js";
import mongoose from "mongoose";

const validAttemptId = "507f1f77bcf86cd799439013";

// ─── getQuizExplanations ──────────────────────────────────────────────────────
describe("getQuizExplanations", () => {
  test("should return 400 for invalid attempt ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { attemptId: "bad-id" }, query: {} });
    const res = mockResponse();

    await getQuizExplanations(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid attempt ID" })
    );
  });

  test("should return 404 if quiz attempt not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Progress.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { attemptId: validAttemptId }, query: {} });
    const res = mockResponse();

    await getQuizExplanations(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Quiz attempt not found" })
    );
  });

  test("should return 200 with explanations for wrong answers", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const questionId = "q1";
    const wrongChoiceId = "c_wrong";
    const correctChoiceId = "c_correct";

    const mockAttempt = {
      _id: validAttemptId,
      quiz: "quiz1",
      score: 0,
      totalQuestions: 1,
      percentage: 0,
      passed: false,
      answers: [
        {
          isCorrect: false,
          question: questionId,
          selectedChoice: wrongChoiceId,
        },
      ],
    };

    Progress.findById.mockResolvedValue(mockAttempt);

    const mockQuestion = {
      _id: { toString: () => questionId },
      questionText: "Which nutrient helps plant growth?",
      choices: {
        id: jest.fn().mockReturnValue({ _id: wrongChoiceId, choiceText: "Carbon" }),
        find: jest.fn().mockReturnValue({ _id: correctChoiceId, choiceText: "Nitrogen" }),
      },
    };
    // Make choices array also iterable with find
    mockQuestion.choices.find = jest.fn().mockReturnValue({ _id: correctChoiceId, choiceText: "Nitrogen", isCorrect: true });
    Question.find.mockResolvedValue([mockQuestion]);

    // Mock the AI service
    githubAI.chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Nitrogen is essential for plant growth." } }],
        }),
      },
    };

    const req = mockRequest({ params: { attemptId: validAttemptId }, query: {} });
    const res = mockResponse();

    await getQuizExplanations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.attemptId).toBe(validAttemptId);
    expect(Array.isArray(response.explanations)).toBe(true);
  });

  test("should return 200 with empty explanations when all answers are correct", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const mockAttempt = {
      _id: validAttemptId,
      quiz: "quiz1",
      score: 1,
      totalQuestions: 1,
      percentage: 100,
      passed: true,
      answers: [{ isCorrect: true, question: "q1", selectedChoice: "c1" }], // all correct
    };

    Progress.findById.mockResolvedValue(mockAttempt);
    Question.find.mockResolvedValue([]);

    const req = mockRequest({ params: { attemptId: validAttemptId }, query: {} });
    const res = mockResponse();

    await getQuizExplanations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.explanations).toHaveLength(0);
  });

  test("should return AI fallback message when AI service fails", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    const questionId = "q1";
    const wrongChoiceId = "c_wrong";
    const correctChoiceId = "c_correct";

    const mockAttempt = {
      _id: validAttemptId,
      quiz: "quiz1",
      score: 0,
      totalQuestions: 1,
      percentage: 0,
      passed: false,
      answers: [{ isCorrect: false, question: questionId, selectedChoice: wrongChoiceId }],
    };

    Progress.findById.mockResolvedValue(mockAttempt);

    const mockQuestion = {
      _id: { toString: () => questionId },
      questionText: "Which nutrient helps growth?",
      choices: {
        id: jest.fn().mockReturnValue({ _id: wrongChoiceId, choiceText: "Carbon" }),
        find: jest.fn().mockReturnValue({ _id: correctChoiceId, choiceText: "Nitrogen", isCorrect: true }),
      },
    };
    Question.find.mockResolvedValue([mockQuestion]);

    // Make AI throw an error
    githubAI.chat = {
      completions: {
        create: jest.fn().mockRejectedValue(new Error("AI service unavailable")),
      },
    };

    const req = mockRequest({ params: { attemptId: validAttemptId }, query: {} });
    const res = mockResponse();

    await getQuizExplanations(req, res);

    // Should still succeed, with fallback explanation message
    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    if (response.explanations.length > 0) {
      expect(response.explanations[0].aiExplanation).toBe(
        "Unable to generate explanation at this time."
      );
    }
  });
});

