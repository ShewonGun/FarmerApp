import express from "express";
import {
    createPlatformRating,
    getMyPlatformRating,
    getPlatformRatingByUser,
    getAllPlatformRatings,
    deleteMyPlatformRating
} from "../../controllers/SupportControllers/platformServiceRatingController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


//Farmer submits rating
router.post("/", authenticate, farmerOnly, createPlatformRating);

//Farmer gets their own rating
router.get("/my", authenticate, farmerOnly, getMyPlatformRating);

//Farmer deletes their own rating
router.delete("/my", authenticate, farmerOnly, deleteMyPlatformRating);


//Admin gets all ratings
router.get("/", authenticate, adminOnly, getAllPlatformRatings);

//Admin gets rating by user ID
router.get("/:userId", authenticate, adminOnly, getPlatformRatingByUser);


export default router;
