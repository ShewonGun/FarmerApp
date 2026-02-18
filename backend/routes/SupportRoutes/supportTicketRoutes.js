import express from "express";
import {
    createSupportTicket,
    getTicketsByUser,
    getAllTickets,
    updateSupportTicket,
    deleteSupportTicket,
    replyToTicket,
    updateTicketStatus
} from "../../controllers/SupportControllers/supportTicketController.js";

const router = express.Router();



// 👨‍🌾 Farmer Routes
// Create ticket
router.post("/", createSupportTicket);

// Get tickets by farmer
router.get("/user/:userId", getTicketsByUser);

// Update ticket (only if Open)
router.put("/:ticketId", updateSupportTicket);

// Delete ticket (only if Open)
router.delete("/:ticketId", deleteSupportTicket);


// 👨‍💼 Admin Routes
// Get all tickets
router.get("/", getAllTickets);

// Admin reply to ticket
router.put("/:ticketId/reply", replyToTicket);

// Admin update ticket status
router.put("/:ticketId/status", updateTicketStatus);


export default router;
