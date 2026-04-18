// libs
import { Router } from "express";
// types
import type { Express } from "express";
import type { RedisClientType } from "redis";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
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

interface ModuleRoutes {
  signup: Router;
  login: Router;
  logout: Router;
  token: Router;
  unlockAccount: Router;
  forgotPassword: Router;
  user: Router;
  loginHistoryUser: Router;
  loginHistoryAdmin: Router;
  contact: Router;
  contactAdmin: Router;
  blog: Router;
}

const mountRoutes = (app: Express, routes: ModuleRoutes): void => {
  const v1Router = Router();

  // Auth
  v1Router.use("/auth/signup", routes.signup);
  v1Router.use("/auth/login", routes.login);
  v1Router.use("/auth/logout", routes.logout);
  v1Router.use("/auth/token", routes.token);
  v1Router.use("/auth/unlock", routes.unlockAccount);
  v1Router.use("/auth/forgot-password", routes.forgotPassword);

  // User
  v1Router.use("/users", routes.user);
  v1Router.use("/login-history", routes.loginHistoryUser);
  v1Router.use("/admin/login-history", routes.loginHistoryAdmin);

  // Contact
  v1Router.use("/contact", routes.contact);
  v1Router.use("/admin/contacts", routes.contactAdmin);

  // Apps
  v1Router.use("/apps/blogs", routes.blog);

  app.use("/api/v1", v1Router);
};

export const loadModules = (
  app: Express,
  emailDispatcher: EmailDispatcher
): void => {
  const redisClient = instanceRedis.getClient() as RedisClientType;

  // --- Shared infrastructure ---
  const { authService } = createAuthenticationModule();
  const auth = authGuard(authService);
  const optionalAuth = optionalAuthGuard(authService);
  const rateLimiter = new RateLimiterMiddleware(redisClient);

  // --- Module creation ---
  const { userRouter, userService } = createUserModule(
    auth,
    rateLimiter,
    authService
  );

  const {
    loginHistoryService,
    loginHistoryUserRouter,
    loginHistoryAdminRouter
  } = createLoginHistoryModule(auth, adminGuard);

  const { loginRouter, loginService } = createLoginModule(
    redisClient,
    authService,
    loginHistoryService,
    emailDispatcher,
    rateLimiter
  );

  const { signupRouter } = createSignupModule(
    redisClient,
    authService,
    userService,
    emailDispatcher,
    rateLimiter
  );

  const { logoutRouter } = createLogoutModule(auth);
  const { tokenRouter } = createTokenModule(authService);

  const { unlockAccountRouter } = createUnlockAccountModule(
    redisClient,
    authService,
    loginHistoryService,
    loginService,
    emailDispatcher,
    rateLimiter
  );

  const { forgotPasswordRouter } = createForgotPasswordModule(
    redisClient,
    authService,
    loginHistoryService,
    emailDispatcher,
    rateLimiter
  );

  const { contactAdminRouter, contactAdminQueryAdminRouter } =
    createContactAdminModule(auth, adminGuard, rateLimiter);

  const { blogRouter } = createBlogModule(auth, optionalAuth);

  // --- Route mounting ---
  mountRoutes(app, {
    signup: signupRouter,
    login: loginRouter,
    logout: logoutRouter,
    token: tokenRouter,
    unlockAccount: unlockAccountRouter,
    forgotPassword: forgotPasswordRouter,
    user: userRouter,
    loginHistoryUser: loginHistoryUserRouter,
    loginHistoryAdmin: loginHistoryAdminRouter,
    contact: contactAdminRouter,
    contactAdmin: contactAdminQueryAdminRouter,
    blog: blogRouter
  });

  Logger.info("Modules loaded and routes mounted successfully");
};
