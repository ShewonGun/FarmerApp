import express from "express";
import { signup, login, googleAuth, viewAccount, updateAccount, updateProfilePicture, changePassword, deactivateAccount, activateAccount, createAdmin, getAllUsers } from "../../controllers/userControllers/userController.js";
import { authenticate, adminOnly, isSelfOrAdmin } from "../../middlewares/protect.js";

const router = express.Router();

// Public routes - No authentication required
router.post("/signup", signup);
router.post("/login", login);
router.post("/google-auth", googleAuth);

// Protected routes - User can access their own, admin can access any
router.get("/user/:userId", authenticate, isSelfOrAdmin, viewAccount);
router.put("/user/:userId", authenticate, isSelfOrAdmin, updateAccount);
router.put("/user/:userId/profile-image", authenticate, isSelfOrAdmin, updateProfilePicture);
router.put("/user/:userId/change-password", authenticate, isSelfOrAdmin, changePassword);
router.put("/user/:userId/deactivate", authenticate, isSelfOrAdmin, deactivateAccount);
router.put("/user/:userId/activate", authenticate, adminOnly, activateAccount);

// Admin only routes
router.get("/users", authenticate, adminOnly, getAllUsers);
router.post("/users/admin", authenticate, adminOnly, createAdmin);

export default router;