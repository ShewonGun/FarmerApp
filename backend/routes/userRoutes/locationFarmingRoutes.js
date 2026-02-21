import express from "express";
import {
    createLocationFarming,
    getMyLocationFarming,
    getAllLocationFarmings,
    updateLocationFarming,
    deleteLocationFarming
} from "../../controllers/userControllers/locationFarmingController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


//Farmer Routes
router.post("/", authenticate, farmerOnly, createLocationFarming);
router.get("/my", authenticate, farmerOnly, getMyLocationFarming);
router.put("/my", authenticate, farmerOnly, updateLocationFarming);
router.delete("/my", authenticate, farmerOnly, deleteLocationFarming);

//Admin Routes
router.get("/", authenticate, adminOnly, getAllLocationFarmings);


export default router;
