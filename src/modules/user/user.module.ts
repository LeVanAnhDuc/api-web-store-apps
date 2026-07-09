// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// others
import { MongoUserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { createUserRoutes, createUserAdminRoutes } from "./user.routes";

export const createUserModule = (
  rateLimiter: RateLimiterMiddleware,
  authService: AuthenticationService
) => {
  const userRepo = new MongoUserRepository();
  const userService = new UserService(userRepo, authService);
  const userController = new UserController(userService);

  return {
    userRouter: createUserRoutes(userController, rateLimiter),
    userAdminRouter: createUserAdminRoutes(userController),
    userService
  };
};
