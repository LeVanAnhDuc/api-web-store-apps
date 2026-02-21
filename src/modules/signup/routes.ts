import { Router } from "express";
import {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
  completeSignupController,
  checkEmailController
} from "@/modules/signup/controller";
import { validate } from "@/middlewares/validation";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/modules/signup/schema";

const signupRouter = Router();

signupRouter.post(
  "/send-otp",
  (req, res, next) => getRateLimiterMiddleware().signupOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
  validate(sendOtpSchema, "body"),
  sendOtpController
);

signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  verifyOtpController
);

signupRouter.post(
  "/resend-otp",
  (req, res, next) => getRateLimiterMiddleware().signupOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
  validate(resendOtpSchema, "body"),
  resendOtpController
);

signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  completeSignupController
);

signupRouter.get(
  "/check-email/:email",
  (req, res, next) => getRateLimiterMiddleware().checkEmailByIp(req, res, next),
  validate(checkEmailSchema, "params"),
  checkEmailController
);

export default signupRouter;
