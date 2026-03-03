import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/repositories/authentication";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { FailedAttemptsRepository } from "@/modules/login/repositories/failed-attempts.repository";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { UnlockAccountRepository } from "./repositories/unlock-account.repository";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

export const createUnlockAccountModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  loginHistorySvc: LoginHistoryService,
  failedAttemptsRepo: FailedAttemptsRepository,
  rateLimiter: RateLimiterMiddleware
) => {
  const unlockAccountRepo = new UnlockAccountRepository(redisClient);

  const unlockAccountService = new UnlockAccountService(
    authRepo,
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
