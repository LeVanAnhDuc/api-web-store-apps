/**
 * Signup Routes
 * RESTful endpoints for signup flow
 */

import { Router } from "express";

// controllers
import {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
  completeSignupController,
  checkEmailController
} from "@/modules/signup/controller";

// middlewares
import { validate } from "@/shared/middlewares/validation";
import {
  getSignupIpRateLimiter,
  getSignupEmailRateLimiter,
  getCheckEmailRateLimiter
} from "@/shared/middlewares/rate-limit";

// schemas
import {
  completeSignupSchema,
  sendOtpSchema,
  verifyOtpSchema,
  checkEmailSchema
} from "@/modules/signup/schema";

const signupRouter = Router();

/**
 * POST /signup/send-otp
 * Send OTP to email for first time
 * Rate limited by IP and Email
 */
signupRouter.post(
  "/send-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(sendOtpSchema, "body"),
  sendOtpController
);

/**
 * POST /signup/verify-otp
 * Verify OTP code
 */
signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  verifyOtpController
);

/**
 * POST /signup/resend-otp
 * Resend OTP to email (tracks resend count)
 * Rate limited by IP and Email
 */
signupRouter.post(
  "/resend-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(sendOtpSchema, "body"),
  resendOtpController
);

/**
 * POST /signup/complete
 * Complete signup with profile data
 */
signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  completeSignupController
);

/**
 * GET /signup/check-email/:email
 * Check if email is available for registration
 * Rate limited by IP only
 */
signupRouter.get(
  "/check-email/:email",
  (req, res, next) => getCheckEmailRateLimiter()(req, res, next),
  validate(checkEmailSchema, "params"),
  checkEmailController
);

export default signupRouter;
