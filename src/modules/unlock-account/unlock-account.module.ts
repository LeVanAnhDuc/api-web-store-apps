import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/modules/authen/repositories/authentication.repository";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { FailedAttemptsRepository } from "@/modules/login/repositories/failed-attempts.repository";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { RedisUnlockAccountRepository } from "./repositories/unlock-account.repository";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

export const createUnlockAccountModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  userRepo: UserRepository,
  loginHistorySvc: LoginHistoryService,
  failedAttemptsRepo: FailedAttemptsRepository,
  rateLimiter: RateLimiterMiddleware
) => {
  const unlockAccountRepo = new RedisUnlockAccountRepository(redisClient);

  const unlockAccountService = new UnlockAccountService(
    authRepo,
    userRepo,
    loginHistorySvc,
    failedAttemptsRepo,
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
