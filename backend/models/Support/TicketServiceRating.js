import mongoose from "mongoose";

// Ticket Service Rating Fields
export const ticketServiceRatingFields = {
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupportTicket",
        required: true,
        unique: true
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    responseQuality: { type: Number, min: 1, max: 5 },

    resolutionSpeed: { type: Number, min: 1, max: 5 },

    helpfulness: { type: Number, min: 1, max: 5 },

    feedback: { type: String }
};

// Separate collection for ticket ratings
const ticketServiceRatingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ...ticketServiceRatingFields
    },
    {
        timestamps: true
    }
);

const TicketServiceRating = mongoose.model(
    "TicketServiceRating",
    ticketServiceRatingSchema
);

export default TicketServiceRating;
