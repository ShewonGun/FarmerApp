import SupportTicket from "../../models/Support/SupportTicket.js";


// Create new ticket
export const createSupportTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.create(req.body);

        res.status(201).json({
            success: true,
            message: "Support ticket created successfully",
            data: ticket
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get tickets by farmer
export const getTicketsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const tickets = await SupportTicket.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Update ticket (only if still Open)
export const updateSupportTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (ticket.status !== "Open") {
            return res.status(400).json({
                success: false,
                message: "Only Open tickets can be updated"
            });
        }

        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Ticket updated successfully",
            data: updatedTicket
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delete ticket (only if still Open)
export const deleteSupportTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (ticket.status !== "Open") {
            return res.status(400).json({
                success: false,
                message: "Only Open tickets can be deleted"
            });
        }

        await ticket.deleteOne();

        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




// Get all tickets (Admin)
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate("userId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//  Admin reply to ticket
export const replyToTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.adminReply = req.body.adminReply;
        ticket.repliedBy = req.body.adminId; 
        ticket.repliedAt = new Date();
        ticket.status = "Resolved";
        ticket.resolvedAt = new Date();

        await ticket.save();

        res.status(200).json({
            success: true,
            message: "Ticket replied and resolved successfully",
            data: ticket
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Admin edit ticket status manually
export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.status = status;

        if (status === "Resolved") {
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        res.status(200).json({
            success: true,
            message: "Ticket status updated successfully",
            data: ticket
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
