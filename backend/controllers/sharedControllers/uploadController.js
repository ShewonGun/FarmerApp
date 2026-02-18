import cloudinary from "../../config/cloudinary.js";
import multer from "multer";
import { Readable } from "stream";

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Upload image to Cloudinary (supports both multipart and base64)
export const uploadImage = async (req, res) => {
  try {
    let uploadResponse;

    // Handle multipart file upload (from multer)
    if (req.file) {
      const folder = req.body.folder || "courses";

      // Upload to Cloudinary using buffer
      uploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // Create a readable stream from buffer
        const bufferStream = Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });
    }
    // Handle base64 upload (legacy support)
    else if (req.body.file) {
      const fileStr = req.body.file;
      const folder = req.body.folder || "courses";

      uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: folder,
        resource_type: "auto",
      });
    }
    // No file provided
    else {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    res.status(200).json({
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "No public ID provided",
      });
    }

    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    });
  }
};
