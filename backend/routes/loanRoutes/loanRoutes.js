import express from "express";
import {
  createLoan,
  getMyLoans,
  getAllLoansForAdmin,
  approveLoan,
  rejectLoan,
  addRepayment,
  getRepaymentsByLoan 
} from "../../controllers/loanControllers/loanController.js";
import { checkLoanEligibility } from "../../middlewares/loan/loanEligibility.js";
import { authenticate, adminOnly, farmerOnly } from "../../middlewares/protect.js";

const router = express.Router();

router.post("/apply", authenticate, farmerOnly, checkLoanEligibility, createLoan);
router.get("/my", authenticate, farmerOnly, getMyLoans);
router.get("/admin", authenticate, adminOnly, getAllLoansForAdmin);
router.put("/approve/:id", authenticate, adminOnly, approveLoan);
router.put("/reject/:id", authenticate, adminOnly, rejectLoan);
router.post("/repay/:loanId", authenticate, addRepayment);
router.get("/repay/:loanId", authenticate, getRepaymentsByLoan);

export default router;
