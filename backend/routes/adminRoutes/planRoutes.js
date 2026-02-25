import express from "express";
import {
    createPlan,
    getAllPlans,
    getActivePlans,
    getPlanById,
    updatePlan,
    togglePlanStatus,
    deletePlan,
    calculateEMI
} from "../../controllers/adminControllers/planController.js";
import { authenticate, adminOnly } from "../../middlewares/protect.js";

const router = express.Router();

// Public routes (accessible to authenticated users)
router.get("/active", authenticate, getActivePlans);
router.get("/:id", authenticate, getPlanById);
//router.post("/:id/calculate-emi", authenticate, calculateEMI);

// Admin only routes
router.post("/", authenticate, adminOnly, createPlan);
router.get("/", authenticate, adminOnly, getAllPlans);
router.put("/:id", authenticate, adminOnly, updatePlan);
router.patch("/:id/toggle-status", authenticate, adminOnly, togglePlanStatus);
router.delete("/:id", authenticate, adminOnly, deletePlan);

export default router;
