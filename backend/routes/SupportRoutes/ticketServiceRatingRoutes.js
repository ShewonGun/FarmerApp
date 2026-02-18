import express from "express";
import {
    createTicketRating,
    getAllTicketRatings,
    getRatingByTicket,
    deleteTicketRating
} from "../../controllers/SupportControllers/ticketServiceRatingController.js";

const router = express.Router();


// Create ticket rating
router.post("/", createTicketRating);

// Get all ratings (Admin)
router.get("/", getAllTicketRatings);

// Get rating by ticket ID
router.get("/ticket/:ticketId", getRatingByTicket);

// Delete rating
router.delete("/ticket/:ticketId", deleteTicketRating);



export default router;
