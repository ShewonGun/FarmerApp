import mongoose from "mongoose";

// Support Ticket Fields
export const supportTicketFields = {
    category: {
        type: String,
        enum: ["loan", "crop", "technical", "account", "training", "general"],
        required: true
    },

    subject: { type: String, required: true },

    description: { type: String, required: true },

    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },

    status: {
        type: String,
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open"
    },

    adminReply: { type: String },

    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    repliedAt: { type: Date },

    resolvedAt: { type: Date }
};

// Separate collection for support tickets
const supportTicketSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ...supportTicketFields
    },
    {
        timestamps: true
    }
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
