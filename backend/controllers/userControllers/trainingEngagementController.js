import UserEngagement from "../../models/user/TrainingEngagement.js";

//POST /api/engagement
export const createTrainingEngagement = async (req, res) => {
    try {
        const { userId } = req.body;

        // Prevent duplicate record per user
        const existing = await UserEngagement.findOne({ userId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Training & engagement info already exists for this user"
            });
        }

        const engagement = await UserEngagement.create(req.body);

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


//GET /api/engagement/:userId
export const getTrainingEngagementByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const engagement = await UserEngagement
            .findOne({ userId })
            .populate("userId");

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


//GET /api/engagement
export const getAllTrainingEngagements = async (req, res) => {
    try {
        const engagements = await UserEngagement.find().populate("userId");

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


//PUT /api/engagement/:userId
export const updateTrainingEngagement = async (req, res) => {
    try {
        const { userId } = req.params;

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


//DELETE /api/engagement/:userId
export const deleteTrainingEngagement = async (req, res) => {
    try {
        const { userId } = req.params;

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
