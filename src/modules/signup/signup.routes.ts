// libs
import { Router } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { SignupController } from "./signup.controller";
// middlewares
import { bodyPipe, paramsPipe } from "@/middlewares";
// validators
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/validators/schemas/signup";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createSignupRoutes = (
  controller: SignupController,
  rl: RateLimiterMiddleware
): Router => {
  const router = Router();

  router.post(
    "/send-otp",
    rl.signupOtpByIp,
    rl.signupOtpByEmail,
    bodyPipe(sendOtpSchema),
    asyncHandler(controller.sendOtp)
  );

  router.post(
    "/verify-otp",
    bodyPipe(verifyOtpSchema),
    asyncHandler(controller.verifyOtp)
  );

  router.post(
    "/resend-otp",
    rl.signupOtpByIp,
    rl.signupOtpByEmail,
    bodyPipe(resendOtpSchema),
    asyncHandler(controller.resendOtp)
  );

  router.post(
    "/complete",
    bodyPipe(completeSignupSchema),
    asyncHandler(controller.completeSignup)
  );

  router.get(
    "/check-email/:email",
    rl.checkEmailByIp,
    paramsPipe(checkEmailSchema),
    asyncHandler(controller.checkEmail)
  );

  return router;
};
