// types
import type { RedisClientType } from "redis";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { LoginService } from "@/modules/login/login.service";
import type { SendEmailService } from "@/services/email/email.service";
import type { RateLimiterMiddleware } from "@/middlewares";
// repositories
import { RedisUnlockAccountRepository } from "./repositories/unlock-account.repository";
// others
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";
import { createUnlockAccountRoutes } from "./unlock-account.routes";

export const createUnlockAccountModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  loginHistorySvc: LoginHistoryService,
  loginService: LoginService,
  emailService: SendEmailService,
  rateLimiter: RateLimiterMiddleware
) => {
  const unlockAccountRepo = new RedisUnlockAccountRepository(redisClient);

  const unlockAccountService = new UnlockAccountService(
    authService,
    loginHistorySvc,
    loginService,
    unlockAccountRepo,
    emailService
  );
  const unlockAccountController = new UnlockAccountController(
    unlockAccountService
  );

  return {
    unlockAccountRouter: createUnlockAccountRoutes(
      unlockAccountController,
      rateLimiter
    ),
    unlockAccountService
  };
};
