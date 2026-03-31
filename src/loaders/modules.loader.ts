// libs
import { Router } from "express";
// types
import type { Express, Request, Response } from "express";
import type { RedisClientType } from "redis";
// services
import { createEmailModule } from "@/services/email/email.module";
// database
import { instanceRedis } from "@/database/redis";
// modules
import { createAuthenticationModule } from "@/modules/authentication/authentication.module";
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
// middlewares
import {
  authGuard,
  adminGuard,
  optionalAuthGuard,
  RateLimiterMiddleware
} from "@/middlewares";
// others
import { Logger } from "@/utils/logger";

export const loadModules = (app: Express): void => {
  const redisClient = instanceRedis.getClient() as RedisClientType;

  const { emailService } = createEmailModule();
  const { authService } = createAuthenticationModule();
  const auth = authGuard(authService);
  const optionalAuth = optionalAuthGuard(authService);
  const rateLimiter = new RateLimiterMiddleware(redisClient);

  const { userRouter, userService } = createUserModule(auth, rateLimiter);

  const {
    loginHistoryService,
    loginHistoryUserRouter,
    loginHistoryAdminRouter
  } = createLoginHistoryModule(auth, adminGuard);

  const { loginRouter, loginService } = createLoginModule(
    redisClient,
    authService,
    loginHistoryService,
    emailService,
    rateLimiter
  );

  const { signupRouter } = createSignupModule(
    redisClient,
    authService,
    userService,
    emailService,
    rateLimiter
  );

  const { logoutRouter } = createLogoutModule(auth);

  const { tokenRouter } = createTokenModule();

  const { unlockAccountRouter } = createUnlockAccountModule(
    redisClient,
    authService,
    loginHistoryService,
    loginService,
    emailService,
    rateLimiter
  );

  const { forgotPasswordRouter } = createForgotPasswordModule(
    redisClient,
    authService,
    loginHistoryService,
    emailService,
    rateLimiter
  );

  const { contactAdminRouter, contactAdminQueryAdminRouter } =
    createContactAdminModule(auth, adminGuard, rateLimiter);

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
