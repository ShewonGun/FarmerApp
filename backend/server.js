import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import courseRoutes from "./routes/courseRoutes/courseRoutes.js"; 
import lessonRoutes from "./routes/courseRoutes/lessonRoutes.js";
import quizRoutes from "./routes/courseRoutes/quizRoutes.js";
import questionRoutes from "./routes/courseRoutes/questionRoutes.js";
import progressRoutes from "./routes/courseRoutes/progressRoutes.js";
import userRoutes from "./routes/userRoutes/userRoutes.js";
import certificateRoutes from "./routes/courseRoutes/certifcateRoutes.js";

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
app.use("/api", lessonRoutes);
app.use("/api", courseRoutes);
app.use("/api", quizRoutes);
app.use("/api", questionRoutes);
app.use("/api", progressRoutes);
app.use("/api", certificateRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
