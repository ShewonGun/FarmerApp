import express from "express";
import {
    createTrainingEngagement,
    getMyTrainingEngagement,
    getAllTrainingEngagements,
    updateTrainingEngagement,
    deleteTrainingEngagement
} from "../../controllers/userControllers/trainingEngagementController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


//Farmer Routes
router.post("/", authenticate, farmerOnly, createTrainingEngagement);
router.get("/my", authenticate, farmerOnly, getMyTrainingEngagement);
router.put("/my", authenticate, farmerOnly, updateTrainingEngagement);
router.delete("/my", authenticate, farmerOnly, deleteTrainingEngagement);

//Admin Routes
router.get("/", authenticate, adminOnly, getAllTrainingEngagements);


export default router;
