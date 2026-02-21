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
router.get("/plans/active", authenticate, getActivePlans);
router.get("/plans/:id", authenticate, getPlanById);
//router.post("/plans/:id/calculate-emi", authenticate, calculateEMI);

// Admin only routes
router.post("/plans", authenticate, adminOnly, createPlan);
router.get("/plans", authenticate, adminOnly, getAllPlans);
router.put("/plans/:id", authenticate, adminOnly, updatePlan);
router.patch("/plans/:id/toggle-status", authenticate, adminOnly, togglePlanStatus);
router.delete("/plans/:id", authenticate, adminOnly, deletePlan);

export default router;
