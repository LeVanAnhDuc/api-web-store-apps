import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { requestLogger } from "@/middlewares/request-logger";
import { i18nMiddleware } from "./i18n";
import { setupSwagger } from "@/config/swagger.setup";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use(i18nMiddleware);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

setupSwagger(app);

export default app;
