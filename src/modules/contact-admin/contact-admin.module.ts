import type { AuthGuard } from "@/middlewares/guards/auth.guard";
import type { AdminGuard } from "@/middlewares/guards/admin.guard";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter.middleware";
import { MongoContactRepository } from "./repositories/contact.repository";
import { ContactAdminService } from "./contact-admin.service";
import { ContactAdminController } from "./contact-admin.controller";

export const createContactAdminModule = (
  auth: AuthGuard,
  adminGuard: AdminGuard,
  rateLimiter: RateLimiterMiddleware
) => {
  const contactRepo = new MongoContactRepository();
  const contactAdminService = new ContactAdminService(contactRepo);
  const contactAdminController = new ContactAdminController(
    contactAdminService,
    auth,
    adminGuard,
    rateLimiter
  );

  return {
    contactAdminRouter: contactAdminController.router,
    contactAdminQueryAdminRouter: contactAdminController.adminRouter
  };
};
