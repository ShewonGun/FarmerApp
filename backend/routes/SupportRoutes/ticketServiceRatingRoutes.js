import express from "express";
import {
    createTicketRating,
    getAllTicketRatings,
    getRatingByTicket,
    deleteTicketRating
} from "../../controllers/SupportControllers/ticketServiceRatingController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();



// Create ticket rating (only ticket owner)
router.post("/", authenticate, farmerOnly, createTicketRating);

// Get rating by ticket (owner OR admin handled inside controller)
router.get("/ticket/:ticketId", authenticate, getRatingByTicket);

// Delete own rating
router.delete("/ticket/:ticketId", authenticate, deleteTicketRating);


// Get all ratings
router.get("/", authenticate, adminOnly, getAllTicketRatings);


export default router;
