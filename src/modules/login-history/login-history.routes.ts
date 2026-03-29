// libs
import { Router } from "express";
import type { RequestHandler } from "express";
// types
import type { LoginHistoryController } from "./login-history.controller";
// middlewares
import { queryPipe } from "@/middlewares";
// validators
import {
  loginHistoryQuerySchema,
  loginHistoryAdminQuerySchema
} from "@/validators/schemas/login-history";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createLoginHistoryUserRoutes = (
  controller: LoginHistoryController,
  authGuard: RequestHandler
): Router => {
  const router = Router();

  router.use(authGuard);

  router.get(
    "/",
    queryPipe(loginHistoryQuerySchema),
    asyncHandler(controller.getMyHistory)
  );

  return router;
};

export const createLoginHistoryAdminRoutes = (
  controller: LoginHistoryController,
  authGuard: RequestHandler,
  adminGuard: RequestHandler
): Router => {
  const router = Router();

  router.use(authGuard, adminGuard);

  router.get(
    "/",
    queryPipe(loginHistoryAdminQuerySchema),
    asyncHandler(controller.getAllHistory)
  );

  return router;
};
