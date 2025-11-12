import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import apiV1Routes from "./routes/v1.routes";
import { requestLogger } from "./core/middlewares/request-logger";
import { handleError, handleNotFound } from "./core/middlewares/error-handler";
import { handleMongooseError } from "./core/middlewares/mongoose-error-handler";
import { i18nMiddleware } from "./i18n";

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

app.use(requestLogger);

app.use(i18nMiddleware);

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
app.use(handleMongooseError);
app.use(handleError);

export default app;
