import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/repositories/authentication.repository";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { OtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import { MagicLinkForgotPasswordRepository } from "./repositories/magic-link-forgot-password.repository";
import { ResetTokenRepository } from "./repositories/reset-token.repository";
import { ForgotPasswordService } from "./forgot-password.service";
import { ForgotPasswordController } from "./forgot-password.controller";

export const createForgotPasswordModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  loginHistorySvc: LoginHistoryService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpRepo = new OtpForgotPasswordRepository(redisClient);
  const magicLinkRepo = new MagicLinkForgotPasswordRepository(redisClient);
  const resetTokenRepo = new ResetTokenRepository(redisClient);

  const forgotPasswordService = new ForgotPasswordService(
    authRepo,
    loginHistorySvc,
    otpRepo,
    magicLinkRepo,
    resetTokenRepo
  );
  const forgotPasswordController = new ForgotPasswordController(
    forgotPasswordService,
    rateLimiter
  );

  return {
    forgotPasswordRouter: forgotPasswordController.router
  };
};
