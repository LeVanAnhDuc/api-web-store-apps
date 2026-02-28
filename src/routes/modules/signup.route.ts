import { Router } from "express";
import { signupController } from "@/modules/signup/controller";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/validators/schemas/signup";

const signupRouter = Router();

signupRouter.post(
  "/send-otp",
  (req, res, next) => getRateLimiterMiddleware().signupOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
  validate(sendOtpSchema, "body"),
  signupController.sendOtp
);

signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  signupController.verifyOtp
);

signupRouter.post(
  "/resend-otp",
  (req, res, next) => getRateLimiterMiddleware().signupOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
  validate(resendOtpSchema, "body"),
  signupController.resendOtp
);

signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  signupController.completeSignup
);

signupRouter.get(
  "/check-email/:email",
  (req, res, next) => getRateLimiterMiddleware().checkEmailByIp(req, res, next),
  validate(checkEmailSchema, "params"),
  signupController.checkEmail
);

export default signupRouter;
