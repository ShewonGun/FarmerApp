import express from "express";
import cors from "cors";

import userRoutes from "../../routes/userRoutes/userRoutes.js";
import financialRoutes from "../../routes/userRoutes/financialRoutes.js";
import locationFarmingRoutes from "../../routes/userRoutes/locationFarmingRoutes.js";
import trainingEngagementRoutes from "../../routes/userRoutes/trainingEngagementRoutes.js";
import verificationTrustRoutes from "../../routes/userRoutes/verificationTrustRoutes.js";

import courseRoutes from "../../routes/courseRoutes/courseRoutes.js";
import lessonRoutes from "../../routes/courseRoutes/lessonRoutes.js";
import quizRoutes from "../../routes/courseRoutes/quizRoutes.js";
import questionRoutes from "../../routes/courseRoutes/questionRoutes.js";
import progressRoutes from "../../routes/courseRoutes/progressRoutes.js";
import certificateRoutes from "../../routes/courseRoutes/certifcateRoutes.js";
import enrollmentRoutes from "../../routes/courseRoutes/enrollmentRoutes.js";
import aiCourseRoutes from "../../routes/courseRoutes/aiCourseRoute.js";

import supportTicketRoutes from "../../routes/SupportRoutes/supportTicketRoutes.js";
import ticketServiceRatingRoutes from "../../routes/SupportRoutes/ticketServiceRatingRoutes.js";
import platformServiceRatingRoutes from "../../routes/SupportRoutes/platformServiceRatingRoutes.js";

import planRoutes from "../../routes/adminRoutes/planRoutes.js";
import weatherRoutes from "../../routes/adminRoutes/weatherRoutes.js";

import loanRoutes from "../../routes/loanRoutes/loanRoutes.js";
import loanCategoryRoutes from "../../routes/loanRoutes/loanCategoryRoutes.js";
import uploadRoutes from "../../routes/sharedRoutes/uploadRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API working");
});

app.use("/api", userRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/location-farming", locationFarmingRoutes);
app.use("/api/training-engagement", trainingEngagementRoutes);
app.use("/api/verification-trust", verificationTrustRoutes);

app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/ai", aiCourseRoutes);

app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/ticket-ratings", ticketServiceRatingRoutes);
app.use("/api/platform-ratings", platformServiceRatingRoutes);

app.use("/api/plans", planRoutes);
app.use("/api/weather", weatherRoutes);

app.use("/api/loans", loanRoutes);
app.use("/api/loan-categories", loanCategoryRoutes);

app.use("/api/upload", uploadRoutes);

export default app;
