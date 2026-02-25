import express from "express";
import {
  createLoan,
  approveLoan,
  addRepayment,
  getRepaymentsByLoan 
} from "../../controllers/loanControllers/loanController.js";

import { checkLoanEligibility } from "../../middlewares/loan/loanEligibility.js";

const router = express.Router();

router.post("/apply", checkLoanEligibility, createLoan);
router.put("/approve/:id", approveLoan);
router.post("/repay/:loanId", addRepayment);
router.get("/repay/:loanId", getRepaymentsByLoan);

export default router;
