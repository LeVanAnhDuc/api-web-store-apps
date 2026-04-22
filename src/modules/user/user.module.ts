// types
import type { RateLimiterMiddleware } from "@/middlewares";
// repositories
import { MongoUserRepository } from "./user.repository";
// others
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createUserRoutes } from "./user.routes";

export const createUserModule = (rateLimiter: RateLimiterMiddleware) => {
  const userRepo = new MongoUserRepository();
  const userService = new UserService(userRepo);
  const userController = new UserController(userService);

  return {
    userRouter: createUserRoutes(userController, rateLimiter),
    userService
  };
};
