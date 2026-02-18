import TicketServiceRating from "../../models/support/TicketServiceRating.js";


// CREATE Ticket Rating
export const createTicketRating = async (req, res) => {
    try {
        const { ticketId } = req.body;

        // Prevent duplicate rating per ticket
        const existing = await TicketServiceRating.findOne({ ticketId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This ticket has already been rated"
            });
        }

        const rating = await TicketServiceRating.create(req.body);

        res.status(201).json({
            success: true,
            message: "Ticket service rating submitted successfully",
            data: rating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//  GET All Ticket Ratings (Admin) 
export const getAllTicketRatings = async (req, res) => {
    try {
        const ratings = await TicketServiceRating.find()
            .populate("userId")
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



// GET Rating by Ticket ID
export const getRatingByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const rating = await TicketServiceRating.findOne({ ticketId })
            .populate("userId")
            .populate("ticketId");

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found for this ticket"
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



// DELETE Ticket Rating
export const deleteTicketRating = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const rating = await TicketServiceRating.findOneAndDelete({ ticketId });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

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

