import express from "express";
import {
    createFinancialInfo,
    getMyFinancialInfo,
    getAllFinancialInfos,
    updateFinancialInfo,
    deleteFinancialInfo
} from "../../controllers/userControllers/financialInfoController.js";

import {
    authenticate,
    farmerOnly,
    adminOnly
} from "../../middlewares/protect.js";

const router = express.Router();


//Farmer Routes
router.post("/", authenticate, farmerOnly, createFinancialInfo);
router.get("/my", authenticate, farmerOnly, getMyFinancialInfo);
router.put("/my", authenticate, farmerOnly, updateFinancialInfo);
router.delete("/my", authenticate, farmerOnly, deleteFinancialInfo);


//Admin Route
router.get("/", authenticate, adminOnly, getAllFinancialInfos);

export default router;
