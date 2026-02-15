import express from "express";
import User from "../../models/user/CoreIdentity.js";
import { locationFarmingFields } from "../../models/user/LocationFarming.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

const locationFieldNames = Object.keys(locationFarmingFields);

// ========== Location & Farming - Get section for a user ==========
router.get(
    "/user/:userId/location-farming",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).select(locationFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const locationFarming = {};
            locationFieldNames.forEach((field) => {
                locationFarming[field] = user[field];
            });

            res.status(200).json({
                success: true,
                data: locationFarming,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ========== Location & Farming - Update section for a user ==========
router.put(
    "/user/:userId/location-farming",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;

            const updates = {};
            locationFieldNames.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true }
            ).select(locationFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Location & farming information updated successfully",
                data: user,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;

