import { Router } from "express";
import type { Express } from "express";
import type { RedisClientType } from "redis";
import { instanceRedis } from "@/database/redis";
import { AuthenticationRepository } from "@/repositories/authentication.repository";
import { UserRepository } from "@/repositories/user.repository";
import { AuthGuard } from "@/middlewares/auth.guard";
import { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { createLoginHistoryModule } from "@/modules/login-history/login-history.module";
import { createLoginModule } from "@/modules/login/login.module";
import { createSignupModule } from "@/modules/signup/signup.module";
import { createLogoutModule } from "@/modules/logout/logout.module";
import { createTokenModule } from "@/modules/token/token.module";
import { createUnlockAccountModule } from "@/modules/unlock-account/unlock-account.module";
import { createForgotPasswordModule } from "@/modules/forgot-password/forgot-password.module";
import { Logger } from "@/utils/logger";

export const loadModules = (app: Express): void => {
  const redisClient = instanceRedis.getClient() as RedisClientType;

  const authRepo = new AuthenticationRepository();
  const userRepo = new UserRepository();
  const auth = new AuthGuard(authRepo);
  const rateLimiter = new RateLimiterMiddleware(redisClient);

  const { loginHistoryService } = createLoginHistoryModule();

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

  const { tokenRouter } = createTokenModule();

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

  const v1Router = Router();
  v1Router.use("/auth/signup", signupRouter);
  v1Router.use("/auth/login", loginRouter);
  v1Router.use("/auth/logout", logoutRouter);
  v1Router.use("/auth/token", tokenRouter);
  v1Router.use("/auth/unlock", unlockAccountRouter);
  v1Router.use("/auth/forgot-password", forgotPasswordRouter);

  app.use("/api/v1", v1Router);
  Logger.info("Modules loaded and routes mounted successfully");
};
