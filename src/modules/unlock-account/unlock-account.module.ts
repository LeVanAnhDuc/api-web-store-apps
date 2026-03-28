import type { RedisClientType } from "redis";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { LoginService } from "@/modules/login/login.service";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter";
import { RedisUnlockAccountRepository } from "./repositories/unlock-account.repository";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

export const createUnlockAccountModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  userService: UserService,
  loginHistorySvc: LoginHistoryService,
  loginService: LoginService,
  rateLimiter: RateLimiterMiddleware
) => {
  const unlockAccountRepo = new RedisUnlockAccountRepository(redisClient);

  const unlockAccountService = new UnlockAccountService(
    authService,
    userService,
    loginHistorySvc,
    loginService,
    unlockAccountRepo
  );
  const unlockAccountController = new UnlockAccountController(
    unlockAccountService,
    rateLimiter
  );

  return {
    unlockAccountRouter: unlockAccountController.router,
    unlockAccountService
  };
};
