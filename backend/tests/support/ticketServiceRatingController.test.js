// tests/support/ticketServiceRatingController.test.js
// Unit tests for ticketServiceRatingController: createTicketRating, getAllTicketRatings, getTicketRatingByTicketId

import {
  createTicketRating,
  getAllTicketRatings,
  getRatingByTicket,
} from "../../controllers/SupportControllers/ticketServiceRatingController.js";
import { mockRequest, mockResponse } from "../setup.js";

jest.mock("../../models/support/TicketServiceRating.js");
jest.mock("../../models/Support/SupportTicket.js");

import TicketServiceRating from "../../models/support/TicketServiceRating.js";
import SupportTicket from "../../models/Support/SupportTicket.js";

const userId   = "507f1f77bcf86cd799439011";
const ticketId = "507f1f77bcf86cd799439012";

// ─── createTicketRating ───────────────────────────────────────────────────────
describe("createTicketRating", () => {
  test("should return 404 if ticket not found", async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const req = mockRequest({
      user: { _id: userId },
      body: { ticketId, rating: 5, comment: "Great support" },
    });
    const res = mockResponse();

    await createTicketRating(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Ticket not found" })
    );
  });

  test("should return 403 if user does not own the ticket", async () => {
    SupportTicket.findById.mockResolvedValue({
      _id: ticketId,
      userId: { toString: () => "another-user-id" },
      status: "Resolved",
    });

    const req = mockRequest({
      user: { _id: { toString: () => userId } },
      body: { ticketId, rating: 5, comment: "Great" },
    });
    const res = mockResponse();

    await createTicketRating(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You can only rate your own ticket" })
    );
  });

  test("should return 400 if ticket is not Resolved", async () => {
    SupportTicket.findById.mockResolvedValue({
      _id: ticketId,
      userId: { toString: () => userId },
      status: "Open",
    });

    const req = mockRequest({
      user: { _id: { toString: () => userId } },
      body: { ticketId, rating: 5, comment: "Good" },
    });
    const res = mockResponse();

    await createTicketRating(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You can only rate resolved tickets" })
    );
  });

  test("should return 400 if ticket has already been rated", async () => {
    SupportTicket.findById.mockResolvedValue({
      _id: ticketId,
      userId: { toString: () => userId },
      status: "Resolved",
    });
    TicketServiceRating.findOne.mockResolvedValue({ _id: "existing-rating" });

    const req = mockRequest({
      user: { _id: { toString: () => userId } },
      body: { ticketId, rating: 5, comment: "Good" },
    });
    const res = mockResponse();

    await createTicketRating(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "This ticket has already been rated" })
    );
  });

  test("should create rating and return 201", async () => {
    SupportTicket.findById.mockResolvedValue({
      _id: ticketId,
      userId: { toString: () => userId },
      status: "Resolved",
    });
    TicketServiceRating.findOne.mockResolvedValue(null);
    const mockRating = { _id: "rating1", userId, ticketId, rating: 5 };
    TicketServiceRating.create.mockResolvedValue(mockRating);

    const req = mockRequest({
      user: { _id: { toString: () => userId } },
      body: { ticketId, rating: 5, comment: "Excellent support!" },
    });
    const res = mockResponse();

    await createTicketRating(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockRating })
    );
  });
});

// ─── getAllTicketRatings ───────────────────────────────────────────────────────
describe("getAllTicketRatings", () => {
  test("should return 200 with all ticket ratings", async () => {
    const mockRatings = [
      { _id: "r1", rating: 5 },
      { _id: "r2", rating: 4 },
    ];
    TicketServiceRating.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockRatings),
    });

    const req = mockRequest({});
    const res = mockResponse();

    await getAllTicketRatings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

// ─── getRatingByTicket ───────────────────────────────────────────────────────
describe("getRatingByTicket", () => {
  test("should return 404 if rating not found for ticket", async () => {
    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(null);
    TicketServiceRating.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId, role: "admin" } });
    const res = mockResponse();

    await getRatingByTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Rating not found for this ticket" })
    );
  });

  test("should return 200 with the ticket rating", async () => {
    const mockRating = { _id: "r1", ticketId, rating: 5 };
    const populateMock = jest.fn();
    populateMock
      .mockReturnValueOnce({ populate: populateMock })
      .mockResolvedValue(mockRating);
    TicketServiceRating.findOne.mockReturnValue({ populate: populateMock });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId, role: "admin" } });
    const res = mockResponse();

    await getRatingByTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockRating })
    );
  });
});
