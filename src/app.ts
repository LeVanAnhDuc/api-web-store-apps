// libs
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
// config
import { setupSwagger } from "@/config/swagger.setup";
import config from "@/config/env";
// middlewares
import { requestLogger } from "@/middlewares";
// others
import { i18nMiddleware } from "./i18n";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use(i18nMiddleware);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

setupSwagger(app);

export default app;
