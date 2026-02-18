import express from "express";
import {
    createPlatformRating,
    getPlatformRatingByUser,
    getAllPlatformRatings,
    deletePlatformRating
} from "../../controllers/SupportControllers/platformServiceRatingController.js";

const router = express.Router();


// Create platform rating
router.post("/", createPlatformRating);

// Get all ratings (Admin)
router.get("/", getAllPlatformRatings);

// Get rating by user ID
router.get("/:userId", getPlatformRatingByUser);

// Delete rating
router.delete("/:userId", deletePlatformRating);


export default router;
