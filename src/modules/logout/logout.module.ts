// types
import type { RequestHandler } from "express";
// others
import { LogoutService } from "./logout.service";
import { LogoutController } from "./logout.controller";
import { createLogoutRoutes } from "./logout.routes";

export const createLogoutModule = (authGuard: RequestHandler) => {
  const logoutService = new LogoutService();
  const logoutController = new LogoutController(logoutService);

  return {
    logoutRouter: createLogoutRoutes(logoutController, authGuard),
    logoutService
  };
};
