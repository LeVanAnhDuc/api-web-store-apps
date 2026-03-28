import type { RequestHandler } from "express";
import { LogoutService } from "./logout.service";
import { LogoutController } from "./logout.controller";

export const createLogoutModule = (auth: RequestHandler) => {
  const logoutService = new LogoutService();
  const logoutController = new LogoutController(logoutService, auth);

  return {
    logoutRouter: logoutController.router,
    logoutService
  };
};
