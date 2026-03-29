// libs
import { Router } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { LoginController } from "./login.controller";
// middlewares
import { bodyPipe } from "@/middlewares";
// validators
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/validators/schemas/login";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createLoginRoutes = (
  controller: LoginController,
  rl: RateLimiterMiddleware
): Router => {
  const router = Router();

  router.post(
    "/",
    rl.loginByIp,
    bodyPipe(loginSchema),
    asyncHandler(controller.login)
  );

  router.post(
    "/otp/send",
    rl.loginOtpByIp,
    rl.loginOtpByEmail,
    bodyPipe(otpSendSchema),
    asyncHandler(controller.sendOtp)
  );

  router.post(
    "/otp/verify",
    rl.loginByIp,
    bodyPipe(otpVerifySchema),
    asyncHandler(controller.verifyOtp)
  );

  router.post(
    "/magic-link/send",
    rl.magicLinkByIp,
    rl.magicLinkByEmail,
    bodyPipe(magicLinkSendSchema),
    asyncHandler(controller.sendMagicLink)
  );

  router.post(
    "/magic-link/verify",
    rl.loginByIp,
    bodyPipe(magicLinkVerifySchema),
    asyncHandler(controller.verifyMagicLink)
  );

  return router;
};
