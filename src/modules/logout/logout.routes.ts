// libs
import { Router } from "express";
// types
import type { LogoutController } from "./logout.controller";
// middlewares
import { authGuard } from "@/middlewares";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createLogoutRoutes = (controller: LogoutController): Router => {
  const router = Router();
  const logout = Router();

  logout.post("/", authGuard, asyncHandler(controller.logout));

  router.use("/auth/logout", logout);
  return router;
};
