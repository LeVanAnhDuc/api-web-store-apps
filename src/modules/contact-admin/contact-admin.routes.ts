// libs
import { Router } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { ContactAdminController } from "./contact-admin.controller";
// middlewares
import {
  adminGuard,
  authGuard,
  bodyPipe,
  paramsPipe,
  queryPipe
} from "@/middlewares";
// validators
import {
  submitContactSchema,
  contactIdParamSchema,
  updateContactStatusSchema,
  adminListContactsQuerySchema
} from "@/validators/schemas/contact-admin";
// others
import { asyncHandler } from "@/utils/async-handler";

export const createContactRoutes = (
  controller: ContactAdminController,
  rl: RateLimiterMiddleware
): Router => {
  const router = Router();

  router.post(
    "/submit",
    rl.contactByIp,
    bodyPipe(submitContactSchema),
    asyncHandler(controller.submit)
  );

  return router;
};

export const createContactAdminRoutes = (
  controller: ContactAdminController
): Router => {
  const router = Router();

  router.use(authGuard, adminGuard);

  router.get(
    "/",
    queryPipe(adminListContactsQuerySchema),
    asyncHandler(controller.getContactList)
  );

  router.get(
    "/:id",
    paramsPipe(contactIdParamSchema),
    asyncHandler(controller.getContactDetail)
  );

  router.patch(
    "/:id/status",
    paramsPipe(contactIdParamSchema),
    bodyPipe(updateContactStatusSchema),
    asyncHandler(controller.updateContactStatus)
  );

  return router;
};
