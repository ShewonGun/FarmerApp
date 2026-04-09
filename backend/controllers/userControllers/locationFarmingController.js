import UserFarmingLocation from "../../models/user/LocationFarming.js";


//CREATE Location & Farming Info (Farmer Only)
export const createLocationFarming = async (req, res) => {
    try {
        const userId = req.user._id;

        const existing = await UserFarmingLocation.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Location & farming info already exists for this user"
            });
        }

        const farmingInfo = await UserFarmingLocation.create({
            ...req.body,
            userId
        });

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



//GET My Location & Farming Info (Farmer)
export const getMyLocationFarming = async (req, res) => {
    try {
        const userId = req.user._id;

        const farmingInfo = await UserFarmingLocation
            .findOne({ userId })
            .populate("userId", "name email role");

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



//GET All Location & Farming Records (Admin Only)
export const getAllLocationFarmings = async (req, res) => {
    try {
        const records = await UserFarmingLocation.find()
            .populate("userId", "name email role");

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



//UPDATE My Location & Farming Info (Farmer)
export const updateLocationFarming = async (req, res) => {
    try {
        const userId = req.user._id;

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



// DELETE location & Farming Info (Farmer Only)
export const deleteLocationFarming = async (req, res) => {
    try {
        const userId = req.user._id;

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


