import express from "express";
import User from "../../models/user/CoreIdentity.js";
import { trainingEngagementFields } from "../../models/user/TrainingEngagement.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

const trainingFieldNames = Object.keys(trainingEngagementFields);

// ========== Training & Engagement - Get section for a user ==========
router.get(
    "/user/:userId/training-engagement",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).select(trainingFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const trainingEngagement = {};
            trainingFieldNames.forEach((field) => {
                trainingEngagement[field] = user[field];
            });

            res.status(200).json({
                success: true,
                data: trainingEngagement,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ========== Training & Engagement - Update section for a user ==========
router.put(
    "/user/:userId/training-engagement",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;

            const updates = {};
            trainingFieldNames.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true }
            ).select(trainingFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Training & engagement information updated successfully",
                data: user,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;

