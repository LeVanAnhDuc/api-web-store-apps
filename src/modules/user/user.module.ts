// types
import type { RequestHandler } from "express";
import type { RateLimiterMiddleware } from "@/middlewares";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// repositories
import { MongoUserRepository } from "./repositories/user.repository";
// others
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createUserRoutes } from "./user.routes";

export const createUserModule = (
  authGuard: RequestHandler,
  rateLimiter: RateLimiterMiddleware,
  authService: AuthenticationService
) => {
  const userRepo = new MongoUserRepository();
  const userService = new UserService(userRepo, authService);
  const userController = new UserController(userService);

  return {
    userRouter: createUserRoutes(userController, authGuard, rateLimiter),
    userService
  };
};
