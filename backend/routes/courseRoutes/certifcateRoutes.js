import express from "express";
import {
    generateCertificate,
    getCertificate,
    getUserCertificates
} from "../../controllers/courseControllers/certificateController.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Certificate routes 
router.post("/:userId/course/:courseId", authenticate, isSelfOrAdmin, generateCertificate);
router.get("/:userId/course/:courseId", authenticate, isSelfOrAdmin, getCertificate);
router.get("/:userId", authenticate, isSelfOrAdmin, getUserCertificates);

export default router;
