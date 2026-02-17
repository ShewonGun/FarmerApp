import express from "express";
import {
    createTrainingEngagement,
    getTrainingEngagementByUser,
    getAllTrainingEngagements,
    updateTrainingEngagement,
    deleteTrainingEngagement
} from "../../controllers/userControllers/trainingEngagementController.js";

const router = express.Router();

router.post("/", createTrainingEngagement);
router.get("/", getAllTrainingEngagements);
router.get("/:userId", getTrainingEngagementByUser);
router.put("/:userId", updateTrainingEngagement);
router.delete("/:userId", deleteTrainingEngagement);

export default router;