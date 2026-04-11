import TicketServiceRating from "../../models/Support/TicketServiceRating.js";
import SupportTicket from "../../models/Support/SupportTicket.js";

/** @returns {undefined | null | number} undefined = omitted, null = invalid */
const parseOptionalRating = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 5) return null;
    return n;
};

/** Required 1–5 */
const parseRequiredRating = (value) => {
    const n = parseOptionalRating(value);
    if (n === undefined) return undefined;
    return n;
};

//CREATE Ticket Rating (Farmer Only)
export const createTicketRating = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            ticketId,
            rating,
            responseQuality,
            resolutionSpeed,
            helpfulness,
            feedback,
            comment,
        } = req.body;

        const mainRating = parseRequiredRating(rating);
        if (mainRating === undefined) {
            return res.status(400).json({
                success: false,
                message: "rating is required (1–5)",
            });
        }
        if (mainRating === null) {
            return res.status(400).json({
                success: false,
                message: "rating must be between 1 and 5",
            });
        }

        const rq = parseOptionalRating(responseQuality);
        const rs = parseOptionalRating(resolutionSpeed);
        const hf = parseOptionalRating(helpfulness);
        if (rq === null || rs === null || hf === null) {
            return res.status(400).json({
                success: false,
                message: "Optional ratings must be between 1 and 5 when provided",
            });
        }

        const rawFeedback = feedback ?? comment;
        const feedbackText =
            typeof rawFeedback === "string" ? rawFeedback.trim() : "";

        // Check ticket exists
        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }

        //Ensure farmer owns the ticket
        if (ticket.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only rate your own ticket",
            });
        }

        // Optional: allow rating only if resolved
        if (ticket.status !== "Resolved") {
            return res.status(400).json({
                success: false,
                message: "You can only rate resolved tickets",
            });
        }

        // Prevent duplicate rating
        const existing = await TicketServiceRating.findOne({ ticketId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This ticket has already been rated",
            });
        }

        const doc = {
            userId,
            ticketId,
            rating: mainRating,
        };
        if (rq !== undefined) doc.responseQuality = rq;
        if (rs !== undefined) doc.resolutionSpeed = rs;
        if (hf !== undefined) doc.helpfulness = hf;
        if (feedbackText) doc.feedback = feedbackText;

        const newRating = await TicketServiceRating.create(doc);

        res.status(201).json({
            success: true,
            message: "Ticket service rating submitted successfully",
            data: newRating,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
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
