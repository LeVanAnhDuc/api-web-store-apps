// libs
import { Router } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { ForgotPasswordController } from "./forgot-password.controller";
// middlewares
import { bodyPipe } from "@/middlewares";
// validators
import {
  fpOtpSendSchema,
  fpOtpVerifySchema,
  fpMagicLinkSendSchema,
  fpMagicLinkVerifySchema,
  fpResetPasswordSchema
} from "@/validators/schemas/forgot-password";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createForgotPasswordRoutes = (
  controller: ForgotPasswordController,
  rl: RateLimiterMiddleware
): Router => {
  const router = Router();

  router.post(
    "/otp/send",
    rl.forgotPasswordOtpByIp,
    rl.forgotPasswordOtpByEmail,
    bodyPipe(fpOtpSendSchema),
    asyncHandler(controller.sendOtp)
  );

  router.post(
    "/otp/verify",
    rl.forgotPasswordOtpByIp,
    bodyPipe(fpOtpVerifySchema),
    asyncHandler(controller.verifyOtp)
  );

  router.post(
    "/magic-link/send",
    rl.forgotPasswordMagicLinkByIp,
    rl.forgotPasswordMagicLinkByEmail,
    bodyPipe(fpMagicLinkSendSchema),
    asyncHandler(controller.sendMagicLink)
  );

  router.post(
    "/magic-link/verify",
    rl.forgotPasswordMagicLinkByIp,
    bodyPipe(fpMagicLinkVerifySchema),
    asyncHandler(controller.verifyMagicLink)
  );

  router.post(
    "/reset",
    rl.forgotPasswordResetByIp,
    bodyPipe(fpResetPasswordSchema),
    asyncHandler(controller.resetPassword)
  );

  return router;
};
