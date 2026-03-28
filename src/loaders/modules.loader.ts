import { Router } from "express";
import type { Express, Request, Response } from "express";
import type { RedisClientType } from "redis";
import { instanceRedis } from "@/database/redis";
import { MongoAuthenticationRepository } from "@/modules/authentication/repositories/authentication.repository";
import { MongoUserRepository } from "@/modules/user/repositories/user.repository";
import { AuthGuard } from "@/middlewares/auth.guard";
import { AdminGuard } from "@/middlewares/admin.guard";
import { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { createLoginHistoryModule } from "@/modules/login-history/login-history.module";
import { createLoginModule } from "@/modules/login/login.module";
import { createSignupModule } from "@/modules/signup/signup.module";
import { createLogoutModule } from "@/modules/logout/logout.module";
import { createTokenModule } from "@/modules/token/token.module";
import { createUnlockAccountModule } from "@/modules/unlock-account/unlock-account.module";
import { createForgotPasswordModule } from "@/modules/forgot-password/forgot-password.module";
import { createContactAdminModule } from "@/modules/contact-admin/contact-admin.module";
import { createUserModule } from "@/modules/user/user.module";
import { createBlogModule } from "@/modules/apps/blog/blog.module";
import { OptionalAuthGuard } from "@/middlewares/optional-auth.guard";
import { Logger } from "@/utils/logger";

export const loadModules = (app: Express): void => {
  const redisClient = instanceRedis.getClient() as RedisClientType;

  const authRepo = new MongoAuthenticationRepository();
  const userRepo = new MongoUserRepository();
  const auth = new AuthGuard(authRepo);
  const adminGuard = new AdminGuard();
  const optionalAuth = new OptionalAuthGuard(authRepo);
  const rateLimiter = new RateLimiterMiddleware(redisClient);

  const {
    loginHistoryService,
    loginHistoryUserRouter,
    loginHistoryAdminRouter
  } = createLoginHistoryModule(auth, adminGuard);

  const { loginRouter, failedAttemptsRepo } = createLoginModule(
    redisClient,
    authRepo,
    userRepo,
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
    userRepo,
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

  const {
    contactAdminRouter,
    contactAdminQueryAdminRouter,
    contactAdminQueryUserRouter
  } = createContactAdminModule(auth, adminGuard, rateLimiter, optionalAuth);

  const { userRouter } = createUserModule(auth, rateLimiter);

  const { blogRouter } = createBlogModule(auth, optionalAuth);

  const v1Router = Router();
  v1Router.use("/auth/signup", signupRouter);
  v1Router.use("/auth/login", loginRouter);
  v1Router.use("/auth/logout", logoutRouter);
  v1Router.use("/auth/token", tokenRouter);
  v1Router.use("/auth/unlock", unlockAccountRouter);
  v1Router.use("/auth/forgot-password", forgotPasswordRouter);
  v1Router.use("/login-history", loginHistoryUserRouter);
  v1Router.use("/admin/login-history", loginHistoryAdminRouter);
  v1Router.use("/contact", contactAdminRouter);
  v1Router.use("/admin/contacts", contactAdminQueryAdminRouter);
  v1Router.use("/auth/contacts", contactAdminQueryUserRouter);
  v1Router.use("/users", userRouter);
  v1Router.use("/apps/blogs", blogRouter);

  app.get("/health", (_req: Request, res: Response) => {
    res
      .status(200)
      .json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", v1Router);
  Logger.info("Modules loaded and routes mounted successfully");
};
