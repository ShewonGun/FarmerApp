import PlatformServiceRating from "../../models/Support/PlatformServiceRating.js";


// CREATE Platform Rating
export const createPlatformRating = async (req, res) => {
    try {
        const { userId } = req.body;

        // Prevent duplicate rating per user
        const existing = await PlatformServiceRating.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a platform rating"
            });
        }

        const rating = await PlatformServiceRating.create(req.body);

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



// GET Platform Rating by User ID
export const getPlatformRatingByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const rating = await PlatformServiceRating.findOne({ userId })
            .populate("userId");

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



// GET All Platform Ratings (Admin)
export const getAllPlatformRatings = async (req, res) => {
    try {
        const ratings = await PlatformServiceRating.find()
            .populate("userId")
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



//DELETE Platform Rating
export const deletePlatformRating = async (req, res) => {
    try {
        const { userId } = req.params;

        const rating = await PlatformServiceRating.findOneAndDelete({ userId });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Platform rating not found"
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
