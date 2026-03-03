import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/repositories/authentication.repository";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { OtpLoginRepository } from "./repositories/otp-login.repository";
import { MagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import { FailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

export const createLoginModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  loginHistorySvc: LoginHistoryService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpLoginRepo = new OtpLoginRepository(redisClient);
  const magicLinkLoginRepo = new MagicLinkLoginRepository(redisClient);
  const failedAttemptsRepo = new FailedAttemptsRepository(redisClient);

  const loginService = new LoginService(
    authRepo,
    loginHistorySvc,
    otpLoginRepo,
    magicLinkLoginRepo,
    failedAttemptsRepo
  );
  const loginController = new LoginController(loginService, rateLimiter);

  return {
    loginRouter: loginController.router,
    loginService,
    failedAttemptsRepo
  };
};
