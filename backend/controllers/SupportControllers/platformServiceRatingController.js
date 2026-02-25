import PlatformServiceRating from "../../models/Support/PlatformServiceRating.js";


// CREATE Platform Rating (Farmer Only)
export const createPlatformRating = async (req, res) => {
    try {
        const userId = req.user._id;  

        // Prevent duplicate rating per user
        const existing = await PlatformServiceRating.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a platform rating"
            });
        }

        const rating = await PlatformServiceRating.create({
            ...req.body,
            userId
        });

        res.status(201).json({
            success: true,
            message: "Platform rating submitted successfully",
            data: rating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// GET My Platform Rating (Farmer)
export const getMyPlatformRating = async (req, res) => {
    try {
        const userId = req.user._id;

        const rating = await PlatformServiceRating
            .findOne({ userId })
            .populate("userId", "name email role");

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "You have not submitted a platform rating"
            });
        }

        res.status(200).json({
            success: true,
            data: rating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// GET Platform Rating by User ID (Admin Only)
export const getPlatformRatingByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const rating = await PlatformServiceRating
            .findOne({ userId })
            .populate("userId", "name email role");

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Platform rating not found for this user"
            });
        }

        res.status(200).json({
            success: true,
            data: rating
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// GET All Platform Ratings (Admin Only)
export const getAllPlatformRatings = async (req, res) => {
    try {
        const ratings = await PlatformServiceRating.find()
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ratings.length,
            data: ratings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// DELETE My Platform Rating (Farmer)
export const deleteMyPlatformRating = async (req, res) => {
    try {
        const userId = req.user._id;

        const rating = await PlatformServiceRating.findOneAndDelete({ userId });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "You have not submitted a platform rating"
            });
        }

        res.status(200).json({
            success: true,
            message: "Platform rating deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
