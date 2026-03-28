import type { AuthGuard, RateLimiterMiddleware } from "@/middlewares";
import { MongoUserRepository } from "./repositories/user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

export const createUserModule = (
  auth: AuthGuard,
  rateLimiter: RateLimiterMiddleware
) => {
  const userRepo = new MongoUserRepository();
  const userService = new UserService(userRepo);
  const userController = new UserController(userService, auth, rateLimiter);

  return {
    userRouter: userController.router,
    userService
  };
};
