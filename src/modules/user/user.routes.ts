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
  const users = Router();

  users.get("/me", authGuard, asyncHandler(controller.getMyProfile));

  users.patch(
    "/me",
    rl.updateProfileByIp,
    authGuard,
    bodyPipe(updateProfileSchema),
    asyncHandler(controller.updateMyProfile)
  );

  users.post(
    "/me/avatar",
    rl.uploadAvatarByIp,
    authGuard,
    uploadAvatar,
    asyncHandler(controller.uploadAvatarHandler)
  );

  users.get(
    "/:id",
    paramsPipe(getPublicProfileSchema),
    asyncHandler(controller.getPublicProfile)
  );

  router.use("/users", users);
  return router;
};
