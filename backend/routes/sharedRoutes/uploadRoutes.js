import express from "express";
import { uploadImage, deleteImage, upload } from "../../controllers/sharedControllers/uploadController.js";
import { authenticate } from "../../middlewares/protect.js";

const router = express.Router();

// Upload image endpoint
router.post("/upload/image", authenticate, upload.single('image'), uploadImage);

// Delete image endpoint
router.delete("/upload/image", authenticate, deleteImage);

export default router;
