import express from "express";
import {
    createLocationFarming,
    getLocationFarmingByUser,
    getAllLocationFarmings,
    updateLocationFarming,
    deleteLocationFarming
} from "../../controllers/userControllers/locationFarmingController.js";

const router = express.Router();

router.post("/", createLocationFarming);
router.get("/", getAllLocationFarmings);
router.get("/:userId", getLocationFarmingByUser);
router.put("/:userId", updateLocationFarming);
router.delete("/:userId", deleteLocationFarming);

export default router;
