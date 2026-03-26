import type { AuthGuard } from "@/middlewares/auth.guard";
import type { AdminGuard } from "@/middlewares/admin.guard";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import type { OptionalAuthGuard } from "@/middlewares/optional-auth.guard";
import { MongoContactRepository } from "@/repositories/contact.repository";
import { ContactAdminService } from "./contact-admin.service";
import { ContactAdminController } from "./contact-admin.controller";

export const createContactAdminModule = (
  auth: AuthGuard,
  adminGuard: AdminGuard,
  rateLimiter: RateLimiterMiddleware,
  optionalAuth: OptionalAuthGuard
) => {
  const contactRepo = new MongoContactRepository();
  const contactAdminService = new ContactAdminService(contactRepo);
  const contactAdminController = new ContactAdminController(
    contactAdminService,
    auth,
    adminGuard,
    rateLimiter,
    optionalAuth
  );

  return {
    contactAdminRouter: contactAdminController.router,
    contactAdminQueryAdminRouter: contactAdminController.adminRouter,
    contactAdminQueryUserRouter: contactAdminController.userContactRouter
  };
};
