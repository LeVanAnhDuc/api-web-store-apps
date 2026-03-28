import type { RequestHandler } from "express";
import { LogoutService } from "./logout.service";
import { LogoutController } from "./logout.controller";

export const createLogoutModule = (authGuard: RequestHandler) => {
  const logoutService = new LogoutService();
  const logoutController = new LogoutController(logoutService, authGuard);

  return {
    logoutRouter: logoutController.router,
    logoutService
  };
};
