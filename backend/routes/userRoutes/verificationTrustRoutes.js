import express from "express";
import {
    createVerification,
    getMyVerification,
    updateMyVerification,
    getVerificationByUser,
    getAllVerifications,
    updateVerification,
    deleteVerification
} from "../../controllers/userControllers/verificationTrustController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly,
    requireMongoIdParam,
} from "../../middlewares/protect.js";

const router = express.Router();


// 👨‍🌾 Farmer Routes
router.post("/", authenticate, farmerOnly, createVerification);
router.get("/my", authenticate, farmerOnly, getMyVerification);
router.put("/my", authenticate, farmerOnly, updateMyVerification);


// 👨‍💼 Admin Routes (ObjectId guard so "my" never hits adminOnly)
router.get("/", authenticate, adminOnly, getAllVerifications);
router.get("/:userId", authenticate, requireMongoIdParam(), adminOnly, getVerificationByUser);
router.put("/:userId", authenticate, requireMongoIdParam(), adminOnly, updateVerification);
router.delete("/:userId", authenticate, requireMongoIdParam(), adminOnly, deleteVerification);

export default router;
