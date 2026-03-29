// libs
import type { RedisClientType } from "redis";
// types
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { LoginService } from "@/modules/login/login.service";
import type { SendEmailService } from "@/services/email/email.service";
import type { RateLimiterMiddleware } from "@/middlewares";
// others
import { RedisUnlockAccountRepository } from "./repositories/unlock-account.repository";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";
import { createUnlockAccountRoutes } from "./unlock-account.routes";

export const createUnlockAccountModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  userService: UserService,
  loginHistorySvc: LoginHistoryService,
  loginService: LoginService,
  emailService: SendEmailService,
  rateLimiter: RateLimiterMiddleware
) => {
  const unlockAccountRepo = new RedisUnlockAccountRepository(redisClient);

  const unlockAccountService = new UnlockAccountService(
    authService,
    userService,
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
