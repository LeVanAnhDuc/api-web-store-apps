import type { AuthMiddleware } from "@/middlewares/auth";
import { LogoutService } from "./logout.service";
import { LogoutController } from "./logout.controller";

export const createLogoutModule = (auth: AuthMiddleware) => {
  const logoutService = new LogoutService();
  const logoutController = new LogoutController(logoutService, auth);

  return {
    logoutRouter: logoutController.router,
    logoutService
  };
};
