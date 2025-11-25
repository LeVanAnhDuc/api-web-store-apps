import { Router } from "express";
import {
  sendOtpController,
  verifyOtpController,
  completeSignupController
} from "@/modules/signup/controller";
import { validate } from "@/shared/middlewares/validation";
import {
  getSignupIpRateLimiter,
  getSignupEmailRateLimiter
} from "@/shared/middlewares/rate-limit";
import {
  completeSignupSchema,
  sendOtpSchema,
  verifyOtpSchema
} from "@/modules/signup/schema";

const signupRouter = Router();

// Send OTP with dual rate limiting (IP + Email)
signupRouter.post(
  "/send-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(sendOtpSchema, "body"),
  sendOtpController
);

signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  verifyOtpController
);

// Resend OTP with same rate limiting as send-otp
signupRouter.post(
  "/resend-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(sendOtpSchema, "body"),
  sendOtpController
);

signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  completeSignupController
);

export default signupRouter;
