// libs
import { Router } from "express";
// types
import type { LoginHistoryController } from "./login-history.controller";
// middlewares
import { adminGuard, authGuard, queryPipe } from "@/middlewares";
// validators
import {
  loginHistoryQuerySchema,
  loginHistoryAdminQuerySchema
} from "@/validators/schemas/login-history";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createLoginHistoryUserRoutes = (
  controller: LoginHistoryController
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
  controller: LoginHistoryController
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
