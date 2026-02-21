import { Router } from "express";
import { unlockRequestController, unlockVerifyController } from "./controller";
import { validate } from "@/middlewares/validation";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import { unlockRequestSchema, unlockVerifySchema } from "./schema";

const unlockAccountRouter = Router();

unlockAccountRouter.post(
  "/request",
  validate(unlockRequestSchema, "body"),
  unlockRequestController
);

unlockAccountRouter.post(
  "/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(unlockVerifySchema, "body"),
  unlockVerifyController
);

export default unlockAccountRouter;
