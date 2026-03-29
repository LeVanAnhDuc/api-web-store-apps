// types
import type { RequestHandler } from "express";
// others
import { MongoLoginHistoryRepository } from "./repositories/login-history.repository";
import { LoginHistoryService } from "./login-history.service";
import { LoginHistoryController } from "./login-history.controller";
import {
  createLoginHistoryUserRoutes,
  createLoginHistoryAdminRoutes
} from "./login-history.routes";

export const createLoginHistoryModule = (
  authGuard: RequestHandler,
  adminGuard: RequestHandler
) => {
  const loginHistoryRepo = new MongoLoginHistoryRepository();
  const loginHistoryService = new LoginHistoryService(loginHistoryRepo);
  const loginHistoryController = new LoginHistoryController(
    loginHistoryService
  );

  return {
    loginHistoryService,
    loginHistoryUserRouter: createLoginHistoryUserRoutes(
      loginHistoryController,
      authGuard
    ),
    loginHistoryAdminRouter: createLoginHistoryAdminRoutes(
      loginHistoryController,
      authGuard,
      adminGuard
    )
  };
};
