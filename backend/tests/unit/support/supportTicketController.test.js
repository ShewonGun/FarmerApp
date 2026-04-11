// tests/support/supportTicketController.test.js
// Unit tests for supportTicketController: createSupportTicket, getMyTickets,
// updateSupportTicket, deleteSupportTicket, getAllTickets, replyToTicket, updateTicketStatus

import {
  createSupportTicket,
  getMyTickets,
  updateSupportTicket,
  deleteSupportTicket,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
} from "../../../controllers/SupportControllers/supportTicketController.js";
import { mockRequest, mockResponse } from "../../setup.js";

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock("../../../models/Support/SupportTicket.js");
import SupportTicket from "../../../models/Support/SupportTicket.js";

const userId = "user123";
const ticketId = "ticket123";

// ─── createSupportTicket ──────────────────────────────────────────────────────
describe("createSupportTicket", () => {
  test("should create a ticket and return 201", async () => {
    const mockTicket = { _id: ticketId, userId, subject: "Issue with loan" };
    SupportTicket.create.mockResolvedValue(mockTicket);

    const req = mockRequest({
      user: { _id: userId },
      body: { subject: "Issue with loan", message: "My loan was not approved." },
    });
    const res = mockResponse();

    await createSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Support ticket created successfully" })
    );
  });

  test("should return 500 on server error", async () => {
    SupportTicket.create.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ user: { _id: userId }, body: {} });
    const res = mockResponse();

    await createSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getMyTickets ─────────────────────────────────────────────────────────────
describe("getMyTickets", () => {
  test("should return 200 with all tickets for the user", async () => {
    const mockTickets = [
      { _id: "t1", userId, subject: "Loan issue" },
      { _id: "t2", userId, subject: "Course issue" },
    ];
    SupportTicket.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTickets) });

    const req = mockRequest({ user: { _id: userId } });
    const res = mockResponse();

    await getMyTickets(req, res);

    expect(SupportTicket.find).toHaveBeenCalledWith({ userId });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

// ─── updateSupportTicket ──────────────────────────────────────────────────────
describe("updateSupportTicket", () => {
  test("should return 404 if ticket not found", async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { ticketId: "notfound" }, user: { _id: userId } });
    const res = mockResponse();

    await updateSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 403 if the user does not own the ticket", async () => {
    SupportTicket.findById.mockResolvedValue({ userId: "otherUser", status: "Open" });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId } });
    const res = mockResponse();

    await updateSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You can only update your own ticket" })
    );
  });

  test("should return 400 if ticket status is not Open", async () => {
    SupportTicket.findById.mockResolvedValue({ userId, status: "Resolved" });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId } });
    const res = mockResponse();

    await updateSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Only Open tickets can be updated" })
    );
  });

  test("should update ticket and return 200", async () => {
    SupportTicket.findById.mockResolvedValue({ userId, status: "Open" });
    const updatedTicket = { _id: ticketId, subject: "Updated Subject" };
    SupportTicket.findByIdAndUpdate.mockResolvedValue(updatedTicket);

    const req = mockRequest({
      params: { ticketId },
      user: { _id: userId },
      body: { subject: "Updated Subject" },
    });
    const res = mockResponse();

    await updateSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Ticket updated successfully" })
    );
  });
});

// ─── deleteSupportTicket ──────────────────────────────────────────────────────
describe("deleteSupportTicket", () => {
  test("should return 404 if ticket not found", async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { ticketId: "notfound" }, user: { _id: userId } });
    const res = mockResponse();

    await deleteSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 403 if user does not own the ticket", async () => {
    SupportTicket.findById.mockResolvedValue({ userId: "otherUser", status: "Open" });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId } });
    const res = mockResponse();

    await deleteSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should return 400 if ticket is not Open", async () => {
    SupportTicket.findById.mockResolvedValue({ userId, status: "Resolved" });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId } });
    const res = mockResponse();

    await deleteSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should delete ticket and return 200", async () => {
    const deleteOneMock = jest.fn().mockResolvedValue(true);
    SupportTicket.findById.mockResolvedValue({ userId, status: "Open", deleteOne: deleteOneMock });

    const req = mockRequest({ params: { ticketId }, user: { _id: userId } });
    const res = mockResponse();

    await deleteSupportTicket(req, res);

    expect(deleteOneMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Ticket deleted successfully" })
    );
  });
});

// ─── getAllTickets (Admin) ─────────────────────────────────────────────────────
describe("getAllTickets", () => {
  test("should return 200 with all tickets", async () => {
    const mockTickets = [
      { _id: "t1", subject: "Issue 1" },
      { _id: "t2", subject: "Issue 2" },
    ];
    SupportTicket.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTickets) }),
    });

    const req = mockRequest({ user: { _id: "admin", role: "admin" } });
    const res = mockResponse();

    await getAllTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 2 })
    );
  });
});

// ─── replyToTicket ────────────────────────────────────────────────────────────
describe("replyToTicket", () => {
  test("should return 404 if ticket not found", async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { ticketId: "notfound" }, user: { _id: "admin" }, body: { adminReply: "We fixed it." } });
    const res = mockResponse();

    await replyToTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should reply and resolve ticket, return 200", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockTicket = {
      _id: ticketId,
      status: "Open",
      adminReply: null,
      repliedBy: null,
      repliedAt: null,
      resolvedAt: null,
      save: saveMock,
    };
    SupportTicket.findById.mockResolvedValue(mockTicket);

    const req = mockRequest({
      params: { ticketId },
      user: { _id: "admin" },
      body: { adminReply: "Issue has been resolved." },
    });
    const res = mockResponse();

    await replyToTicket(req, res);

    expect(mockTicket.status).toBe("Resolved");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Ticket replied and resolved successfully" })
    );
  });
});

// ─── updateTicketStatus ───────────────────────────────────────────────────────
describe("updateTicketStatus", () => {
  test("should return 404 if ticket not found", async () => {
    SupportTicket.findById.mockResolvedValue(null);

    const req = mockRequest({ params: { ticketId: "notfound" }, user: { _id: "admin" }, body: { status: "Closed" } });
    const res = mockResponse();

    await updateTicketStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should update status and return 200", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockTicket = { _id: ticketId, status: "Open", resolvedAt: null, save: saveMock };
    SupportTicket.findById.mockResolvedValue(mockTicket);

    const req = mockRequest({
      params: { ticketId },
      user: { _id: "admin" },
      body: { status: "Resolved" },
    });
    const res = mockResponse();

    await updateTicketStatus(req, res);

    expect(mockTicket.status).toBe("Resolved");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

