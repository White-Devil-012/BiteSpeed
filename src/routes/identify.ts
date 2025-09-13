import { Request, Response, Router } from "express";
import { IdentityService } from "../services/IdentityService";
import { Database } from "../database/Database";
import { IdentifyRequest } from "../types/Contact";

const router = Router();

// Initialize database and service
const database = new Database(process.env.DATABASE_PATH);
const identityService = new IdentityService(database);

// Validation middleware
const validateIdentifyRequest = (
  req: Request,
  res: Response,
  next: Function
) => {
  const { email, phoneNumber } = req.body as IdentifyRequest;

  // At least one of email or phoneNumber must be provided
  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "At least one of email or phoneNumber must be provided",
    });
  }

  // Validate email format if provided
  if (email && typeof email !== "string") {
    return res.status(400).json({
      error: "Email must be a string",
    });
  }

  // Validate phoneNumber format if provided
  if (phoneNumber && typeof phoneNumber !== "string") {
    return res.status(400).json({
      error: "Phone number must be a string",
    });
  }

  next();
};

router.post(
  "/identify",
  validateIdentifyRequest,
  async (req: Request, res: Response) => {
    try {
      const identifyRequest: IdentifyRequest = req.body;
      const result = await identityService.identify(identifyRequest);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in /identify endpoint:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Bitespeed Identity Reconciliation",
  });
});

export default router;
