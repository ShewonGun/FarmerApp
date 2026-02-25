import mongoose from "mongoose";

// Location & Farming Information fields for User
export const locationFarmingFields = {
    country: { type: String },
    regionOrDistrict: { type: String },
    village: { type: String },
    farmSize: { type: Number }, // numeric value
    farmSizeUnit: {
        type: String,
        enum: ["hectares", "acres"],
        default: "hectares"
    },
    mainCrops: [{ type: String }],
    secondaryCrops: [{ type: String }],
    yearsOfFarmingExperience: { type: Number },
    landOwnershipType: {
        type: String,
        enum: ["owned", "rented", "shared", "other"],
        default: "owned"
    }
};

// Separate collection for user location & farming info
const locationFarmingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        ...locationFarmingFields
    },
    {
        timestamps: true
    }
);

const UserFarmingLocation = mongoose.model("UserFarmingLocation", locationFarmingSchema);

export default UserFarmingLocation;

