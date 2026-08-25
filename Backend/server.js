import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js"
import logRoutes from "./routes/logs.js"
import aiRoutes from "./routes/ai.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Parse allowed origins from .env
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS configuration
const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost during development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow origins specified in CLIENT_URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable CORS
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json({ limit: "1mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

// Example API route
app.get("/", (req, res) => {
  res.json({
    message: "AI Habit Tracker Backend is running ",
  });
});

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Database connection failed:");
    console.error(error);
    process.exit(1);
  }
};

startServer();