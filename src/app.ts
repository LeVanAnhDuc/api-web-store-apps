import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import apiV1Routes from "./routes/v1.routes";
import { requestLogger } from "@/infra/middlewares/request-logger";
import { handleError, handleNotFound } from "@/infra/middlewares/error-handler";
import { handleMongooseError } from "@/infra/middlewares/mongoose-error-handler";
import { i18nMiddleware } from "./i18n";
import { setupSwagger } from "@/infra/configs/swagger.setup";

const app = express();

/**
 * Configure middleware
 */
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(requestLogger);

app.use(i18nMiddleware);

/**
 * Swagger Documentation
 * Available at /api-docs
 */
setupSwagger(app);

/**
 * Configure routes
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1", apiV1Routes);

/**
 * Error handlers (must be last)
 */
app.use(handleNotFound);
app.use(handleMongooseError);
app.use(handleError);

export default app;
