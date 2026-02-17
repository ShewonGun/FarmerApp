import express from "express";
import {
    createFinancialInfo,
    getFinancialInfoByUser,
    getAllFinancialInfos,
    updateFinancialInfo,
    deleteFinancialInfo
} from "../../controllers/userControllers/financialInfoController.js";

const router = express.Router();

router.post("/", createFinancialInfo);
router.get("/", getAllFinancialInfos);
router.get("/:userId", getFinancialInfoByUser);
router.put("/:userId", updateFinancialInfo);
router.delete("/:userId", deleteFinancialInfo);

export default router;
