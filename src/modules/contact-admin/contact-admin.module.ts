import type { RequestHandler } from "express";
import type { RateLimiterMiddleware } from "@/middlewares";
import { MongoContactRepository } from "./repositories/contact.repository";
import { ContactAdminService } from "./contact-admin.service";
import { ContactAdminController } from "./contact-admin.controller";

export const createContactAdminModule = (
  authGuard: RequestHandler,
  adminGuard: RequestHandler,
  rateLimiter: RateLimiterMiddleware
) => {
  const contactRepo = new MongoContactRepository();
  const contactAdminService = new ContactAdminService(contactRepo);
  const contactAdminController = new ContactAdminController(
    contactAdminService,
    authGuard,
    adminGuard,
    rateLimiter
  );

  return {
    contactAdminRouter: contactAdminController.router,
    contactAdminQueryAdminRouter: contactAdminController.adminRouter
  };
};
