// libs
import { Router } from "express";
// types
import type { TokenController } from "./token.controller";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createTokenRoutes = (controller: TokenController): Router => {
  const router = Router();

  router.post("/refresh", asyncHandler(controller.refreshToken));

  return router;
};
