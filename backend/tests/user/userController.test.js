// tests/user/userController.test.js
// Unit tests for userController: signup, login, viewAccount, deactivateAccount, getAllUsers

import { signup, login, viewAccount, deactivateAccount, getAllUsers } from "../../controllers/userControllers/userController.js";
import { mockRequest, mockResponse } from "../setup.js";

// ─── Mock external modules ────────────────────────────────────────────────────
jest.mock("../../models/user/User.js");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

import User from "../../models/user/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── signup ───────────────────────────────────────────────────────────────────
describe("signup", () => {
  test("should return 400 if required fields are missing", async () => {
    const req = mockRequest({ body: { email: "test@test.com" } }); // missing name & password
    const res = mockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test("should return 400 if email format is invalid", async () => {
    const req = mockRequest({ body: { name: "John", email: "not-an-email", password: "pass123" } });
    const res = mockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email format" })
    );
  });

  test("should return 400 if password is shorter than 6 characters", async () => {
    const req = mockRequest({ body: { name: "John", email: "john@test.com", password: "123" } });
    const res = mockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Password must be at least 6 characters long" })
    );
  });

  test("should return 409 if user already exists", async () => {
    User.findOne.mockResolvedValue({ email: "john@test.com" });

    const req = mockRequest({ body: { name: "John", email: "john@test.com", password: "pass123" } });
    const res = mockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User with this email already exists" })
    );
  });

  test("should return 201 and token on successful signup", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedPassword");

    const saveMock = jest.fn().mockResolvedValue(true);
    const userInstance = {
      _id: "user123",
      name: "John",
      email: "john@test.com",
      role: "farmer",
      save: saveMock,
    };
    User.mockImplementation(() => userInstance);
    jwt.sign.mockReturnValue("mock.jwt.token");

    const req = mockRequest({ body: { name: "John", email: "john@test.com", password: "pass123" } });
    const res = mockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, token: "mock.jwt.token" })
    );
  });
});

// ─── login ────────────────────────────────────────────────────────────────────
describe("login", () => {
  test("should return 400 if email or password is missing", async () => {
    const req = mockRequest({ body: { email: "john@test.com" } }); // missing password
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return 401 if user is not found", async () => {
    User.findOne.mockResolvedValue(null);

    const req = mockRequest({ body: { email: "unknown@test.com", password: "pass123" } });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email or password" })
    );
  });

  test("should return 403 if account is deactivated", async () => {
    User.findOne.mockResolvedValue({ email: "john@test.com", isActive: false, password: "hashed" });

    const req = mockRequest({ body: { email: "john@test.com", password: "pass123" } });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should return 401 if password is incorrect", async () => {
    User.findOne.mockResolvedValue({ email: "john@test.com", isActive: true, password: "hashed" });
    bcrypt.compare.mockResolvedValue(false);

    const req = mockRequest({ body: { email: "john@test.com", password: "wrongpass" } });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("should return 200 and token on successful login", async () => {
    const mockUser = { _id: "user123", name: "John", email: "john@test.com", role: "farmer", isActive: true, password: "hashed" };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("mock.jwt.token");

    const req = mockRequest({ body: { email: "john@test.com", password: "pass123" } });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, token: "mock.jwt.token" })
    );
  });
});

// ─── viewAccount ──────────────────────────────────────────────────────────────
describe("viewAccount", () => {
  test("should return 404 if user is not found", async () => {
    User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = mockRequest({ params: { userId: "nonexistent" } });
    const res = mockResponse();

    await viewAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 200 with user data", async () => {
    const mockUser = {
      _id: "user123",
      name: "John",
      email: "john@test.com",
      password: "hashed"
    };
    User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });

    const req = mockRequest({ params: { userId: "user123" } });
    const res = mockResponse();

    await viewAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        _id: "user123",
        id: "user123",
        name: "John",
        email: "john@test.com",
        picture: "",
        hasPassword: true
      }
    });
  });
});

// ─── deactivateAccount ────────────────────────────────────────────────────────
describe("deactivateAccount", () => {
  test("should return 404 if user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { userId: "notfound" } });
    const res = mockResponse();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 400 if account is already deactivated", async () => {
    User.findById.mockResolvedValue({ isActive: false });

    const req = mockRequest({ params: { userId: "user123" } });
    const res = mockResponse();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Account is already deactivated" })
    );
  });

  test("should deactivate and return 200", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue({ isActive: true, save: saveMock });

    const req = mockRequest({ params: { userId: "user123" } });
    const res = mockResponse();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Account deactivated successfully" })
    );
  });
});

// ─── getAllUsers ──────────────────────────────────────────────────────────────
describe("getAllUsers", () => {
  test("should return 200 with list of users", async () => {
    const mockUsers = [
      { _id: "1", name: "Alice", email: "alice@test.com" },
      { _id: "2", name: "Bob", email: "bob@test.com" },
    ];
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockUsers) }) });

    const req = mockRequest();
    const res = mockResponse();

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});
