// types
import type { RedisClientType } from "redis";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { RateLimiterMiddleware } from "@/middlewares";
// repositories
import { RedisOtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import { RedisMagicLinkForgotPasswordRepository } from "./repositories/magic-link-forgot-password.repository";
import { RedisResetTokenRepository } from "./repositories/reset-token.repository";
// others
import { ForgotPasswordService } from "./forgot-password.service";
import { ForgotPasswordController } from "./forgot-password.controller";
import { createForgotPasswordRoutes } from "./forgot-password.routes";

export const createForgotPasswordModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  loginHistorySvc: LoginHistoryService,
  emailDispatcher: EmailDispatcher,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpRepo = new RedisOtpForgotPasswordRepository(redisClient);
  const magicLinkRepo = new RedisMagicLinkForgotPasswordRepository(redisClient);
  const resetTokenRepo = new RedisResetTokenRepository(redisClient);

  const forgotPasswordService = new ForgotPasswordService(
    authService,
    loginHistorySvc,
    otpRepo,
    magicLinkRepo,
    resetTokenRepo,
    emailDispatcher
  );
  const forgotPasswordController = new ForgotPasswordController(
    forgotPasswordService
  );

  return {
    forgotPasswordRouter: createForgotPasswordRoutes(
      forgotPasswordController,
      rateLimiter
    )
  };
};
