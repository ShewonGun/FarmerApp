import UserEngagement from "../../models/user/TrainingEngagement.js";


//CREATE Training Engagement (Farmer Only)
export const createTrainingEngagement = async (req, res) => {
    try {
        const userId = req.user._id;

        const existing = await UserEngagement.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Training & engagement info already exists for this user"
            });
        }

        const engagement = await UserEngagement.create({
            ...req.body,
            userId
        });

        res.status(201).json({
            success: true,
            message: "Training & engagement info created successfully",
            data: engagement
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//GET My Training Engagement (Farmer)
export const getMyTrainingEngagement = async (req, res) => {
    try {
        const userId = req.user._id;

        const engagement = await UserEngagement
            .findOne({ userId })
            .populate("userId", "name email role");

        if (!engagement) {
            return res.status(404).json({
                success: false,
                message: "Training & engagement info not found"
            });
        }

        res.status(200).json({
            success: true,
            data: engagement
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//GET All Training Engagements (Admin Only)
export const getAllTrainingEngagements = async (req, res) => {
    try {
        const engagements = await UserEngagement.find()
            .populate("userId", "name email role");

        res.status(200).json({
            success: true,
            count: engagements.length,
            data: engagements
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



//UPDATE My Training Engagement (Farmer)
export const updateTrainingEngagement = async (req, res) => {
    try {
        const userId = req.user._id;

        const updated = await UserEngagement.findOneAndUpdate(
            { userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Training & engagement info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Training & engagement info updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// DELETE My Training Engagement (Farmer Only)
export const deleteTrainingEngagement = async (req, res) => {
    try {
        const userId = req.user._id;

        const deleted = await UserEngagement.findOneAndDelete({ userId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Training & engagement info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Training & engagement info deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
