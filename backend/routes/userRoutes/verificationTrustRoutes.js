import express from "express";
import {
    createVerification,
    getMyVerification,
    getVerificationByUser,
    getAllVerifications,
    updateVerification,
    deleteVerification
} from "../../controllers/userControllers/verificationTrustController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


// 👨‍🌾 Farmer Routes
router.post("/", authenticate, farmerOnly, createVerification);
router.get("/my", authenticate, farmerOnly, getMyVerification);


// 👨‍💼 Admin Routes
router.get("/", authenticate, adminOnly, getAllVerifications);
router.get("/:userId", authenticate, adminOnly, getVerificationByUser);
router.put("/:userId", authenticate, adminOnly, updateVerification);
router.delete("/:userId", authenticate, adminOnly, deleteVerification);

export default router;
