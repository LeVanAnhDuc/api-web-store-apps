// libs
import { Router } from "express";
// types
import type { RequestHandler } from "express";
import type { LogoutController } from "./logout.controller";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createLogoutRoutes = (
  controller: LogoutController,
  authGuard: RequestHandler
): Router => {
  const router = Router();

  router.post("/", authGuard, asyncHandler(controller.logout));

  return router;
};
