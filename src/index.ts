import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import identifyRoutes from "./routes/identify";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/", identifyRoutes);

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

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

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

app.listen(PORT, () => {
  console.log(
    `🚀 Bitespeed Identity Reconciliation Service running on port ${PORT}`
  );
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Identify endpoint: http://localhost:${PORT}/identify`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

export default app;
