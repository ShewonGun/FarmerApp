import express from "express";
import {
    createSupportTicket,
    getMyTickets,
    getAllTickets,
    updateSupportTicket,
    deleteSupportTicket,
    replyToTicket,
    updateTicketStatus
} from "../../controllers/SupportControllers/supportTicketController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


// Create ticket
router.post("/", authenticate, farmerOnly, createSupportTicket);

// Get MY tickets
router.get("/my", authenticate, farmerOnly, getMyTickets);

// Update ticket (only if Open & owner)
router.put("/:ticketId", authenticate, farmerOnly, updateSupportTicket);

// Delete ticket (only if Open & owner)
router.delete("/:ticketId", authenticate, farmerOnly, deleteSupportTicket);



// Get all tickets
router.get("/", authenticate, adminOnly, getAllTickets);

// Admin reply to ticket
router.put("/:ticketId/reply", authenticate, adminOnly, replyToTicket);

// Admin update ticket status
router.put("/:ticketId/status", authenticate, adminOnly, updateTicketStatus);


export default router;
