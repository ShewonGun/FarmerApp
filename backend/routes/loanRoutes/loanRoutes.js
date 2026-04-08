import express from "express";
import {
  createLoan,
  approveLoan,
  addRepayment,
  getRepaymentsByLoan 
} from "../../controllers/loanControllers/loanController.js";
import { checkLoanEligibility } from "../../middlewares/loan/loanEligibility.js";
import { authenticate, adminOnly, farmerOnly } from "../../middlewares/protect.js";

const router = express.Router();

router.post("/apply", authenticate, farmerOnly, checkLoanEligibility, createLoan);
router.put("/approve/:id", authenticate, adminOnly, approveLoan);
router.post("/repay/:loanId", authenticate, addRepayment);
router.get("/repay/:loanId", authenticate, getRepaymentsByLoan);

export default router;
