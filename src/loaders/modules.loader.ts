import type { Express } from "express";
import type { RedisClientType } from "redis";
import { instanceRedis } from "@/database/redis";
import { AuthenticationRepository } from "@/repositories/authentication";
import { UserRepository } from "@/repositories/user";
import { AuthMiddleware } from "@/middlewares/auth";
import { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { createLoginModule } from "@/modules/login/login.module";
import { createSignupModule } from "@/modules/signup/signup.module";
import { createLogoutModule } from "@/modules/logout/logout.module";
import { tokenRouter } from "@/modules/token/token.module";
import { createUnlockAccountModule } from "@/modules/unlock-account/unlock-account.module";
import { createForgotPasswordModule } from "@/modules/forgot-password/forgot-password.module";
import { createV1Router } from "@/routes/v1";
import { mountRoutes } from "@/routes";
import { Logger } from "@/utils/logger";

export const loadModules = (app: Express): void => {
  const redisClient = instanceRedis.getClient() as RedisClientType;

  const authRepo = new AuthenticationRepository();
  const userRepo = new UserRepository();
  const auth = new AuthMiddleware(authRepo);
  const rateLimiter = new RateLimiterMiddleware(redisClient);

  const { loginRouter, failedAttemptsRepo } = createLoginModule(
    redisClient,
    authRepo,
    loginHistoryService,
    rateLimiter
  );

  const { signupRouter } = createSignupModule(
    redisClient,
    authRepo,
    userRepo,
    rateLimiter
  );

  const { logoutRouter } = createLogoutModule(auth);

  const { unlockAccountRouter } = createUnlockAccountModule(
    redisClient,
    authRepo,
    loginHistoryService,
    failedAttemptsRepo,
    rateLimiter
  );

  const { forgotPasswordRouter } = createForgotPasswordModule(
    redisClient,
    authRepo,
    loginHistoryService,
    rateLimiter
  );

  const v1Router = createV1Router({
    signupRouter,
    loginRouter,
    logoutRouter,
    tokenRouter,
    unlockAccountRouter,
    forgotPasswordRouter
  });

  mountRoutes(app, v1Router);
  Logger.info("Modules loaded and routes mounted successfully");
};
