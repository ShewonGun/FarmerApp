import UserTrust from "../../models/user/VerificationTrust.js";


//FARMER: Submit KYC
export const createVerification = async (req, res) => {
    try {
        const userId = req.user._id;

        const existing = await UserTrust.findOne({ userId });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Verification record already exists for this user"
            });
        }

        const verification = await UserTrust.create({
            ...req.body,
            userId
        });

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



//FARMER: Get My Verification
export const getMyVerification = async (req, res) => {
    try {
        const userId = req.user._id;

        const verification = await UserTrust
            .findOne({ userId })
            .populate("userId", "name email role");

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



//ADMIN: Get Verification by User ID
export const getVerificationByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const verification = await UserTrust
            .findOne({ userId })
            .populate("userId", "name email role");

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



//ADMIN: Get All Verifications
export const getAllVerifications = async (req, res) => {
    try {
        const records = await UserTrust.find()
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });

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



//ADMIN: Update Verification Status
export const updateVerification = async (req, res) => {
    try {
        const { userId } = req.params;

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



//ADMIN: Delete Verification
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
