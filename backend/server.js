import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import courseRoutes from "./routes/courseRoutes/courseRoutes.js"; 
import lessonRoutes from "./routes/courseRoutes/lessonRoutes.js";
import quizRoutes from "./routes/courseRoutes/quizRoutes.js";
import questionRoutes from "./routes/courseRoutes/questionRoutes.js";
import progressRoutes from "./routes/courseRoutes/progressRoutes.js";
import certificateRoutes from "./routes/courseRoutes/certifcateRoutes.js";

import userRoutes from "./routes/userRoutes/userRoutes.js";
import financialRoutes from "./routes/userRoutes/financialRoutes.js";
import locationFarmingRoutes from "./routes/userRoutes/locationFarmingRoutes.js";
import trainingEngagementRoutes from "./routes/userRoutes/trainingEngagementRoutes.js";
import verificationTrustRoutes from "./routes/userRoutes/verificationTrustRoutes.js";


import planRoutes from "./routes/adminRoutes/planRoutes.js";
import aiCourseRoutes from "./routes/courseRoutes/aiCourseRoute.js";
import uploadRoutes from "./routes/sharedRoutes/uploadRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API working");
});

// Routes
app.use("/api", userRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/location-farming", locationFarmingRoutes);
app.use("/api/training-engagement", trainingEngagementRoutes);
app.use("/api/verification-trust", verificationTrustRoutes);

app.use("/api", lessonRoutes);
app.use("/api", courseRoutes);
app.use("/api", quizRoutes);
app.use("/api", questionRoutes);
app.use("/api", progressRoutes);
app.use("/api", certificateRoutes);
app.use("/api", planRoutes);
app.use("/api", aiCourseRoutes);
app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
