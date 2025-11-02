// libs
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
// routes
import apiV1Routes from "./api/v1/routes";
// middlewares
import { requestLogger } from "./core/middlewares/requestLogger";
import { rateLimitInstance } from "./core/middlewares/validate";
import { handleError, handleNotFound } from "./core/middlewares/errorHandler";

// Create Express application
const app = express();

/**
 * Configure middleware
 */
// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimitInstance);

/**
 * Configure routes
 */
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use("/api/v1", apiV1Routes);

/**
 * Error handlers (must be last)
 */
app.use(handleNotFound);
app.use(handleError);

export default app;
