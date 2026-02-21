import UserFarmingLocation from "../../models/user/LocationFarming.js";

// @route   POST /api/farming
export const createLocationFarming = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if record already exists
        const existing = await UserFarmingLocation.findOne({ userId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Location & farming info already exists for this user"
            });
        }

        const farmingInfo = await UserFarmingLocation.create(req.body);

        res.status(201).json({
            success: true,
            message: "Location & farming info created successfully",
            data: farmingInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Get Location & Farming Info by User ID
 * @route   GET /api/farming/:userId
 * @access  Private
 */
export const getLocationFarmingByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const farmingInfo = await UserFarmingLocation
            .findOne({ userId })
            .populate("userId");

        if (!farmingInfo) {
            return res.status(404).json({
                success: false,
                message: "Location & farming info not found"
            });
        }

        res.status(200).json({
            success: true,
            data: farmingInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Get All Location & Farming Records (Admin)
 * @route   GET /api/farming
 * @access  Admin
 */
export const getAllLocationFarmings = async (req, res) => {
    try {
        const records = await UserFarmingLocation.find().populate("userId");

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Update Location & Farming Info
 * @route   PUT /api/farming/:userId
 * @access  Private
 */
export const updateLocationFarming = async (req, res) => {
    try {
        const { userId } = req.params;

        const updated = await UserFarmingLocation.findOneAndUpdate(
            { userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Location & farming info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location & farming info updated successfully",
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Delete Location & Farming Info
 * @route   DELETE /api/farming/:userId
 * @access  Admin
 */
export const deleteLocationFarming = async (req, res) => {
    try {
        const { userId } = req.params;

        const deleted = await UserFarmingLocation.findOneAndDelete({ userId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Location & farming info not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location & farming info deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
