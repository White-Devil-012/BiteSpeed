import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import identifyRoutes from "./routes/identify";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request timeout middleware (10 seconds)
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.log("Request timeout for:", req.method, req.path);
      res.status(408).json({
        error: "Request timeout",
        message: "The request took too long to process",
      });
    }
  }, 10000);

  res.on("finish", () => {
    clearTimeout(timeout);
  });

  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/", identifyRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Bitespeed Identity Reconciliation Service",
    version: "1.0.0",
    endpoints: {
      identify: "POST /identify",
      health: "GET /health",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 Bitespeed Identity Reconciliation Service running on port ${PORT}`
  );
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Identify endpoint: http://localhost:${PORT}/identify`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

export default app;
