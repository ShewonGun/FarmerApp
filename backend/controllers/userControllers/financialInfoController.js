import UserFinance from "../../models/user/FinancialInfo.js";


//CREATE Financial Info (Farmer Only)
export const createFinancialInfo = async (req, res) => {
    try {
        const userId = req.user._id;

        const existing = await UserFinance.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Financial info already exists for this user"
            });
        }

        const financialInfo = await UserFinance.create({
            ...req.body,
            userId
        });

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



//GET My Financial Info (Farmer)
export const getMyFinancialInfo = async (req, res) => {
    try {
        const userId = req.user._id;

        const financialInfo = await UserFinance
            .findOne({ userId })
            .populate("userId", "name email role");

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



//GET All Financial Infos (Admin Only)
export const getAllFinancialInfos = async (req, res) => {
    try {
        const financialInfos = await UserFinance.find()
            .populate("userId", "name email role");

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



//UPDATE My Financial Info (Farmer Only)
export const updateFinancialInfo = async (req, res) => {
    try {
        const userId = req.user._id;

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



//DELETE My Financial Info (Farmer Only)
export const deleteFinancialInfo = async (req, res) => {
    try {
        const userId = req.user._id;

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
