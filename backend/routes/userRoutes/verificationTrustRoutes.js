import express from "express";
import {
    createVerification,
    getVerificationByUser,
    getAllVerifications,
    updateVerification,
    deleteVerification
} from "../../controllers/userControllers/verificationTrustController.js";

const router = express.Router();

router.post("/", createVerification);
router.get("/", getAllVerifications);
router.get("/:userId", getVerificationByUser);
router.put("/:userId", updateVerification);
router.delete("/:userId", deleteVerification);

export default router;
