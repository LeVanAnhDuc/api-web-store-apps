// libs
import type { RedisClientType } from "redis";
// types
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { SendEmailService } from "@/services/email/email.service";
import type { RateLimiterMiddleware } from "@/middlewares";
// others
import { RedisOtpLoginRepository } from "./repositories/otp-login.repository";
import { RedisMagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import { RedisFailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";
import { createLoginRoutes } from "./login.routes";

export const createLoginModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  loginHistorySvc: LoginHistoryService,
  emailService: SendEmailService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpLoginRepo = new RedisOtpLoginRepository(redisClient);
  const magicLinkLoginRepo = new RedisMagicLinkLoginRepository(redisClient);
  const failedAttemptsRepo = new RedisFailedAttemptsRepository(redisClient);

  const loginService = new LoginService(
    authService,
    loginHistorySvc,
    otpLoginRepo,
    magicLinkLoginRepo,
    failedAttemptsRepo,
    emailService
  );
  const loginController = new LoginController(loginService);

  return {
    loginRouter: createLoginRoutes(loginController, rateLimiter),
    loginService
  };
};
