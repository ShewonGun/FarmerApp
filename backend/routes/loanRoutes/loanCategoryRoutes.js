import express from "express";
import {
  createLoanCategory,
  getAllLoanCategories,
  getLoanCategoryById,
  updateLoanCategory,
  deleteLoanCategory,
} from "../../controllers/loanControllers/loanCategoryController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

router.post("/", authenticate, adminOnly, createLoanCategory);
router.get("/", getAllLoanCategories);
router.get("/:id", getLoanCategoryById);
router.put("/:id", authenticate, adminOnly, updateLoanCategory);
router.delete("/:id", authenticate, adminOnly, deleteLoanCategory);

export default router;
