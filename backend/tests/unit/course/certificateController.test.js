// tests/course/certificateController.test.js
// Unit tests for certificateController: generateCertificate, getCertificate,
// getUserCertificates, verifyCertificate

import {
  generateCertificate,
  getCertificate,
  getUserCertificates,
  verifyCertificate,
} from "../../../controllers/courseControllers/certificateController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/course/Certificate.js");
jest.mock("../../../models/course/Course.js");
jest.mock("../../../models/user/User.js");
jest.mock("../../../models/course/Enroll.js");
jest.mock("../../../models/course/Progress.js");
jest.mock("../../../models/course/Quiz.js");
jest.mock("../../../models/course/Lesson.js");
jest.mock("../../../config/cloudinary.js");
jest.mock("pdfkit");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}));

import Certificate from "../../../models/course/Certificate.js";
import Course from "../../../models/course/Course.js";
import User from "../../../models/user/User.js";
import Enroll from "../../../models/course/Enroll.js";
import mongoose from "mongoose";

const validUserId   = "507f1f77bcf86cd799439011";
const validCourseId = "507f1f77bcf86cd799439012";

// ─── generateCertificate ──────────────────────────────────────────────────────
describe("generateCertificate", () => {
  test("should return 400 for invalid user or course ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad", courseId: "bad" } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid user or course ID" })
    );
  });

  test("should return 404 if user not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  test("should return 404 if course not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: validUserId, name: "John" });
    Course.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Course not found" })
    );
  });

  test("should return 404 if user is not enrolled", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: validUserId, name: "John" });
    Course.findById.mockResolvedValue({ _id: validCourseId, title: "Rice Farming" });
    Enroll.findOne.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User is not enrolled in this course" })
    );
  });

  test("should return 400 if course is not completed", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: validUserId, name: "John" });
    Course.findById.mockResolvedValue({ _id: validCourseId, title: "Rice Farming" });
    Enroll.findOne.mockResolvedValue({
      completedAt: null, // not completed
      progress: 50,
      completedLessons: [],
      completedQuizzes: [],
    });

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test("should return 200 if certificate already exists", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue({ _id: validUserId, name: "John" });
    Course.findById.mockResolvedValue({ _id: validCourseId, title: "Rice Farming" });
    Enroll.findOne.mockResolvedValue({ completedAt: new Date("2026-01-01"), completedLessons: [], completedQuizzes: [] });
    const existingCert = { _id: "cert1", certificateNumber: "CERT-2026-ABC123" };
    Certificate.findOne.mockResolvedValue(existingCert);

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await generateCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Certificate already exists",
        certificate: existingCert,
      })
    );
  });
});

// ─── getCertificate ───────────────────────────────────────────────────────────
describe("getCertificate", () => {
  test("should return 400 for invalid IDs", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad", courseId: "bad" } });
    const res = mockResponse();

    await getCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 404 if certificate not found", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Certificate.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    });
    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(null);
    Certificate.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await getCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Certificate not found" })
    );
  });

  test("should return 200 with certificate data", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockCert = { _id: "cert1", certificateNumber: "CERT-2026-XYZ" };

    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(mockCert);
    Certificate.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { userId: validUserId, courseId: validCourseId } });
    const res = mockResponse();

    await getCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, certificate: mockCert })
    );
  });
});

// ─── getUserCertificates ──────────────────────────────────────────────────────
describe("getUserCertificates", () => {
  test("should return 400 for invalid user ID", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = mockRequest({ params: { userId: "bad-id" } });
    const res = mockResponse();

    await getUserCertificates(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid user ID" })
    );
  });

  test("should return 200 with all certificates for the user", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockCerts = [
      { _id: "c1", certificateNumber: "CERT-2026-AAA" },
      { _id: "c2", certificateNumber: "CERT-2026-BBB" },
    ];
    Certificate.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockCerts) }),
    });

    const req = mockRequest({ params: { userId: validUserId } });
    const res = mockResponse();

    await getUserCertificates(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2, certificates: mockCerts })
    );
  });
});

// ─── verifyCertificate ────────────────────────────────────────────────────────
describe("verifyCertificate", () => {
  test("should return 404 if certificate number is not found", async () => {
    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(null);
    Certificate.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { certificateNumber: "CERT-INVALID-000" } });
    const res = mockResponse();

    await verifyCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isValid: false, message: "Certificate not found" })
    );
  });

  test("should return 200 with certificate details for a valid number", async () => {
    const mockCert = {
      _id: "cert1",
      certificateNumber: "CERT-2026-XYZ",
      issueDate: new Date("2026-01-10"),
      completionDate: new Date("2026-01-09"),
      averageScore: 88,
      user: { name: "John Doe", username: "johndoe" },
      course: { title: "Rice Farming 101" },
    };

    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(mockCert);
    Certificate.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { certificateNumber: "CERT-2026-XYZ" } });
    const res = mockResponse();

    await verifyCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.isValid).toBe(true);
    expect(response.certificate.studentName).toBe("John Doe");
    expect(response.certificate.courseName).toBe("Rice Farming 101");
  });
});

