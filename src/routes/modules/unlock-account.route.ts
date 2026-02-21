import { Router } from "express";
import {
  unlockRequestController,
  unlockVerifyController
} from "@/modules/unlock-account/controller";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  unlockRequestSchema,
  unlockVerifySchema
} from "@/validators/schemas/unlock-account";

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
