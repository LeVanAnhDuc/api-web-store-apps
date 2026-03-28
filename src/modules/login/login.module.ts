import type { RedisClientType } from "redis";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { RedisOtpLoginRepository } from "./repositories/otp-login.repository";
import { RedisMagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import { RedisFailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

export const createLoginModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  userService: UserService,
  loginHistorySvc: LoginHistoryService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpLoginRepo = new RedisOtpLoginRepository(redisClient);
  const magicLinkLoginRepo = new RedisMagicLinkLoginRepository(redisClient);
  const failedAttemptsRepo = new RedisFailedAttemptsRepository(redisClient);

  const loginService = new LoginService(
    authService,
    userService,
    loginHistorySvc,
    otpLoginRepo,
    magicLinkLoginRepo,
    failedAttemptsRepo
  );
  const loginController = new LoginController(loginService, rateLimiter);

  return {
    loginRouter: loginController.router,
    loginService
  };
};
