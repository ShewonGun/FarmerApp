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
import enrollmentRoutes from "./routes/courseRoutes/enrollmentRoutes.js";
import aiCourseRoutes from "./routes/courseRoutes/aiCourseRoute.js";

import userRoutes from "./routes/userRoutes/userRoutes.js";
import financialRoutes from "./routes/userRoutes/financialRoutes.js";
import locationFarmingRoutes from "./routes/userRoutes/locationFarmingRoutes.js";
import trainingEngagementRoutes from "./routes/userRoutes/trainingEngagementRoutes.js";
import verificationTrustRoutes from "./routes/userRoutes/verificationTrustRoutes.js";
import supportTicketRoutes from "./routes/SupportRoutes/supportTicketRoutes.js";
import ticketServiceRatingRoutes from "./routes/SupportRoutes/ticketServiceRatingRoutes.js";
import platformServiceRatingRoutes from "./routes/SupportRoutes/platformServiceRatingRoutes.js";

import planRoutes from "./routes/adminRoutes/planRoutes.js";

import loanRoutes from "./routes/loanRoutes/loanRoutes.js"
import loanCategoryRoutes from "./routes/loanRoutes/loanCategoryRoutes.js"

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
//User and related routes
app.use("/api", userRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/location-farming", locationFarmingRoutes);
app.use("/api/training-engagement", trainingEngagementRoutes);
app.use("/api/verification-trust", verificationTrustRoutes);

// Course and related routes
app.use("/api/lessons", lessonRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ai", aiCourseRoutes);
app.use("/api/upload", uploadRoutes);

// Loan and related routes
app.use("/api/loans", loanRoutes);
app.use("/api/loan-categories", loanCategoryRoutes);

// Plan and related routes
app.use("/api", uploadRoutes);

// Support and rating routes
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/ticket-ratings", ticketServiceRatingRoutes);
app.use("/api/platform-ratings", platformServiceRatingRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
