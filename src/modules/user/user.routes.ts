// libs
import { Router } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { UserController } from "./user.controller";
// middlewares
import { authGuard, bodyPipe, paramsPipe, uploadAvatar } from "@/middlewares";
// validators
import {
  updateProfileSchema,
  getPublicProfileSchema
} from "@/validators/schemas/user";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createUserRoutes = (
  controller: UserController,
  rl: RateLimiterMiddleware
): Router => {
  const router = Router();

  router.get("/me", authGuard, asyncHandler(controller.getMyProfile));

  router.patch(
    "/me",
    rl.updateProfileByIp,
    authGuard,
    bodyPipe(updateProfileSchema),
    asyncHandler(controller.updateMyProfile)
  );

  router.post(
    "/me/avatar",
    rl.uploadAvatarByIp,
    authGuard,
    uploadAvatar,
    asyncHandler(controller.uploadAvatarHandler)
  );

  router.get(
    "/:id",
    paramsPipe(getPublicProfileSchema),
    asyncHandler(controller.getPublicProfile)
  );

  return router;
};
