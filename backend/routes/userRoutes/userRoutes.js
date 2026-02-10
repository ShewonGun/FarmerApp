import express from "express";
import { signup, login, viewAccount, deactivateAccount, getAllUsers } from "../../controllers/userControllers/userController.js";
import { authenticate, adminOnly, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Public routes - No authentication required
router.post("/signup", signup);
router.post("/login", login);

// Protected routes - User can access their own, admin can access any
router.get("/user/:userId", authenticate, isSelfOrAdmin, viewAccount);
router.put("/user/:userId/deactivate", authenticate, isSelfOrAdmin, deactivateAccount);

// Admin only routes
router.get("/users", authenticate, adminOnly, getAllUsers);

export default router;