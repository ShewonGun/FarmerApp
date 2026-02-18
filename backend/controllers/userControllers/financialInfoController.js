import UserFinance from "../../models/user/FinancialInfo.js";

// POST /api/finance
export const createFinancialInfo = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if financial info already exists for this user
        const existing = await UserFinance.findOne({ userId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Financial info already exists for this user"
            });
        }

        const financialInfo = await UserFinance.create(req.body);

        res.status(201).json({
            success: true,
            message: "Financial info created successfully",
            data: financialInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//GET /api/finance/:userId
export const getFinancialInfoByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const financialInfo = await UserFinance.findOne({ userId }).populate("userId");

        if (!financialInfo) {
            return res.status(404).json({
                success: false,
                message: "Financial info not found"
            });
        }

        res.status(200).json({
            success: true,
            data: financialInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//GET /api/finance
export const getAllFinancialInfos = async (req, res) => {
    try {
        const financialInfos = await UserFinance.find().populate("userId");

        res.status(200).json({
            success: true,
            count: financialInfos.length,
            data: financialInfos
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//PUT /api/finance/:userId
export const updateFinancialInfo = async (req, res) => {
    try {
        const { userId } = req.params;

        const updatedFinancialInfo = await UserFinance.findOneAndUpdate(
            { userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedFinancialInfo) {
            return res.status(404).json({
                success: false,
                message: "Financial info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Financial info updated successfully",
            data: updatedFinancialInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//DELETE /api/finance/:userId
export const deleteFinancialInfo = async (req, res) => {
    try {
        const { userId } = req.params;

        const deleted = await UserFinance.findOneAndDelete({ userId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Financial info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Financial info deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
