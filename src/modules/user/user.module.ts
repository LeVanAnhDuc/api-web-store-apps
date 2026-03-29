// types
import type { RequestHandler } from "express";
import type { RateLimiterMiddleware } from "@/middlewares";
// others
import { MongoUserRepository } from "./repositories/user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createUserRoutes } from "./user.routes";

export const createUserModule = (
  authGuard: RequestHandler,
  rateLimiter: RateLimiterMiddleware
) => {
  const userRepo = new MongoUserRepository();
  const userService = new UserService(userRepo);
  const userController = new UserController(userService);

  return {
    userRouter: createUserRoutes(userController, authGuard, rateLimiter),
    userService
  };
};
