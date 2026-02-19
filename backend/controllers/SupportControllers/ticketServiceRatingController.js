import TicketServiceRating from "../../models/support/TicketServiceRating.js";
import SupportTicket from "../../models/Support/SupportTicket.js";


//CREATE Ticket Rating (Farmer Only)
export const createTicketRating = async (req, res) => {
    try {
        const userId = req.user._id; 
        const { ticketId, rating, comment } = req.body;

        // Check ticket exists
        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        //Ensure farmer owns the ticket
        if (ticket.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only rate your own ticket"
            });
        }

        // Optional: allow rating only if resolved
        if (ticket.status !== "Resolved") {
            return res.status(400).json({
                success: false,
                message: "You can only rate resolved tickets"
            });
        }

        // Prevent duplicate rating
        const existing = await TicketServiceRating.findOne({ ticketId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This ticket has already been rated"
            });
        }

        const newRating = await TicketServiceRating.create({
            userId,
            ticketId,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: "Ticket service rating submitted successfully",
            data: newRating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//GET All Ticket Ratings (Admin Only)
export const getAllTicketRatings = async (req, res) => {
    try {
        const ratings = await TicketServiceRating.find()
            .populate("userId", "name email role")
            .populate("ticketId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ratings.length,
            data: ratings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//GET Rating by Ticket ID (Admin or Owner)
export const getRatingByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user._id;

        const rating = await TicketServiceRating.findOne({ ticketId })
            .populate("userId", "name email role")
            .populate("ticketId");

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found for this ticket"
            });
        }

        // If farmer → only allow access to own rating
        if (
            req.user.role === "farmer" &&
            rating.userId._id.toString() !== userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own ticket rating"
            });
        }

        res.status(200).json({
            success: true,
            data: rating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//DELETE My Ticket Rating (Farmer) or Admin
export const deleteTicketRating = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user._id;

        const rating = await TicketServiceRating.findOne({ ticketId });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        // Farmer can delete only own rating
        if (
            req.user.role === "farmer" &&
            rating.userId.toString() !== userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own rating"
            });
        }

        await rating.deleteOne();

        res.status(200).json({
            success: true,
            message: "Ticket rating deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
