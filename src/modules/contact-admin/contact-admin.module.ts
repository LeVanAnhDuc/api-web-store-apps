// types
import type { RequestHandler } from "express";
import type { RateLimiterMiddleware } from "@/middlewares";
// repositories
import { MongoContactRepository } from "./repositories/contact.repository";
// others
import { ContactAdminService } from "./contact-admin.service";
import { ContactAdminController } from "./contact-admin.controller";
import {
  createContactRoutes,
  createContactAdminRoutes
} from "./contact-admin.routes";

export const createContactAdminModule = (
  authGuard: RequestHandler,
  adminGuard: RequestHandler,
  rateLimiter: RateLimiterMiddleware
) => {
  const contactRepo = new MongoContactRepository();
  const service = new ContactAdminService(contactRepo);
  const controller = new ContactAdminController(service);

  return {
    contactAdminRouter: createContactRoutes(controller, rateLimiter),
    contactAdminQueryAdminRouter: createContactAdminRoutes(
      controller,
      authGuard,
      adminGuard
    )
  };
};
