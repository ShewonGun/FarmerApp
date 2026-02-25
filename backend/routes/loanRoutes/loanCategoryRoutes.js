import express from "express";
import {
  createLoanCategory,
  getAllLoanCategories,
  getLoanCategoryById,
  updateLoanCategory,
  deleteLoanCategory,
} from "../../controllers/loanControllers/loanCategoryController.js";

const router = express.Router();

router.post("/", createLoanCategory);
router.get("/", getAllLoanCategories);
router.get("/:id", getLoanCategoryById);
router.put("/:id", updateLoanCategory);
router.delete("/:id", deleteLoanCategory);

export default router;