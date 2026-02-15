import express from "express";
import {
    signup,
    login,
    viewAccount,
    deactivateAccount,
    getAllUsers
} from "../../controllers/userControllers/coreIdentityController.js";
import { authenticate, adminOnly, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// ========== Core Identity - Public routes (no authentication required) ==========
router.post("/signup", signup);
router.post("/login", login);

// ========== Core Identity - Protected routes ==========
router.get("/user/:userId", authenticate, isSelfOrAdmin, viewAccount);
router.put("/user/:userId/deactivate", authenticate, isSelfOrAdmin, deactivateAccount);

// ========== Core Identity - Restricted routes ==========
router.get("/users", authenticate, adminOnly, getAllUsers);

export default router;

