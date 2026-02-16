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

