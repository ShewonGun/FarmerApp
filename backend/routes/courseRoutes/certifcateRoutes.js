import express from "express";
import {
    generateCertificate,
    getCertificate,
    getUserCertificates
} from "../../controllers/courseControllers/certificateController.js";
import { authenticate, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Certificate routes - User can access their own, admin can access any
router.post("/user/:userId/course/:courseId/certificate", authenticate, isSelfOrAdmin, generateCertificate);
router.get("/user/:userId/course/:courseId/certificate", authenticate, isSelfOrAdmin, getCertificate);
router.get("/user/:userId/certificates", authenticate, isSelfOrAdmin, getUserCertificates);

export default router;
