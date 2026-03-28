import type { RequestHandler } from "express";
import { MongoLoginHistoryRepository } from "./repositories/login-history.repository";
import { LoginHistoryService } from "./login-history.service";
import { LoginHistoryController } from "./login-history.controller";

export const createLoginHistoryModule = (
  auth: RequestHandler,
  adminGuard: RequestHandler
) => {
  const loginHistoryRepo = new MongoLoginHistoryRepository();
  const loginHistoryService = new LoginHistoryService(loginHistoryRepo);
  const loginHistoryController = new LoginHistoryController(
    loginHistoryService,
    auth,
    adminGuard
  );

  return {
    loginHistoryService,
    loginHistoryUserRouter: loginHistoryController.userRouter,
    loginHistoryAdminRouter: loginHistoryController.adminRouter
  };
};
