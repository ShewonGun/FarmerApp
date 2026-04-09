import express from "express";
import {
    createPlatformRating,
    getMyPlatformRating,
    getPlatformRatingByUser,
    getAllPlatformRatings,
    deleteMyPlatformRating,
    getPublicPlatformRatings,
} from "../../controllers/SupportControllers/platformServiceRatingController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly,
    requireMongoIdParam,
} from "../../middlewares/protect.js";

const router = express.Router();

// Public testimonials (no auth — must stay before "/:userId")
router.get("/testimonials", getPublicPlatformRatings);
router.get("/public", getPublicPlatformRatings);

//Farmer submits rating
router.post("/", authenticate, farmerOnly, createPlatformRating);

//Farmer gets their own rating
router.get("/my", authenticate, farmerOnly, getMyPlatformRating);

//Farmer deletes their own rating
router.delete("/my", authenticate, farmerOnly, deleteMyPlatformRating);


//Admin gets all ratings
router.get("/", authenticate, adminOnly, getAllPlatformRatings);

// Admin gets rating by user ID (reject non-ObjectId segments so "public" etc. never hit authenticate)
router.get(
    "/:userId",
    requireMongoIdParam("userId"),
    authenticate,
    adminOnly,
    getPlatformRatingByUser
);


export default router;
