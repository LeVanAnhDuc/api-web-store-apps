import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/modules/authentication/repositories/authentication.repository";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { RedisOtpLoginRepository } from "./repositories/otp-login.repository";
import { RedisMagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import { RedisFailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

export const createLoginModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  userRepo: UserRepository,
  loginHistorySvc: LoginHistoryService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpLoginRepo = new RedisOtpLoginRepository(redisClient);
  const magicLinkLoginRepo = new RedisMagicLinkLoginRepository(redisClient);
  const failedAttemptsRepo = new RedisFailedAttemptsRepository(redisClient);

  const loginService = new LoginService(
    authRepo,
    userRepo,
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
