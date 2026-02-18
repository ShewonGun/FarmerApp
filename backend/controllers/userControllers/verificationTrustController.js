import UserTrust from "../../models/user/VerificationTrust.js";

/**
 * @desc    Create Verification Record (KYC Submit)
 * @route   POST /api/verification
 * @access  Private
 */
export const createVerification = async (req, res) => {
    try {
        const { userId } = req.body;

        // Prevent duplicate verification record
        const existing = await UserTrust.findOne({ userId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Verification record already exists for this user"
            });
        }

        const verification = await UserTrust.create(req.body);

        res.status(201).json({
            success: true,
            message: "Verification submitted successfully",
            data: verification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Get Verification Info by User ID
 * @route   GET /api/verification/:userId
 * @access  Private/Admin
 */
export const getVerificationByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const verification = await UserTrust
            .findOne({ userId })
            .populate("userId");

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: "Verification record not found"
            });
        }

        res.status(200).json({
            success: true,
            data: verification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * @desc    Get All Verification Records (Admin Panel)
 * @route   GET /api/verification
 * @access  Admin
 */
export const getAllVerifications = async (req, res) => {
    try {
        const records = await UserTrust.find().populate("userId");

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
 * @desc    Update Verification Info (Admin Decision)
 * @route   PUT /api/verification/:userId
 * @access  Admin
 */
export const updateVerification = async (req, res) => {
    try {
        const { userId } = req.params;

        // If admin verifies user → set verifiedDate automatically
        if (req.body.verificationStatus === "Verified") {
            req.body.verifiedDate = new Date();
        }

        const updated = await UserTrust.findOneAndUpdate(
            { userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Verification record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Verification status updated successfully",
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
 * @desc    Delete Verification Record
 * @route   DELETE /api/verification/:userId
 * @access  Admin
 */
export const deleteVerification = async (req, res) => {
    try {
        const { userId } = req.params;

        const deleted = await UserTrust.findOneAndDelete({ userId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Verification record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Verification record deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
