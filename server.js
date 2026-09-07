import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./src/services/movies.js";
import tvRoutes from "./src/services/tv.js";
import redisClient from "./src/services/redisClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/movies", movieRoutes);
app.use("/api/tv", tvRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// Connect to Redis in the background
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis initially:", err.message);
});
