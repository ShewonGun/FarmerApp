import express from "express";
import User from "../../models/user/CoreIdentity.js";
import { verificationTrustFields } from "../../models/user/VerificationTrust.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

const verificationFieldNames = Object.keys(verificationTrustFields);

// ========== Verification & Trust - Get section for a user ==========
router.get(
    "/user/:userId/verification-trust",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).select(verificationFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const verificationTrust = {};
            verificationFieldNames.forEach((field) => {
                verificationTrust[field] = user[field];
            });

            res.status(200).json({
                success: true,
                data: verificationTrust,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ========== Verification & Trust - Update section for a user ==========
router.put(
    "/user/:userId/verification-trust",
    authenticate,
    isSelfOrAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;

            const updates = {};
            verificationFieldNames.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true }
            ).select(verificationFieldNames.join(" "));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Verification & trust information updated successfully",
                data: user,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

export default router;

