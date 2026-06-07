// libs
import { Router } from "express";
// types
import type { WebAppController } from "./web-app.controller";
// validators
import { adminListAppsQuerySchema } from "@/validators/schemas/web-app";
// others
import { adminGuard, authGuard, queryPipe } from "@/middlewares";
import { asyncHandler } from "@/utils/async-handler";

export const createAdminWebAppRoutes = (
  controller: WebAppController
): Router => {
  const router = Router();
  const adminApps = Router();

  adminApps.use(authGuard, adminGuard);

  adminApps.get("/categories", asyncHandler(controller.listCategories));

  adminApps.get(
    "/",
    queryPipe(adminListAppsQuerySchema),
    asyncHandler(controller.listApps)
  );

  router.use("/admin/apps", adminApps);
  return router;
};
