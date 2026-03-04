import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import type { OptionalAuthGuard } from "@/middlewares/optional-auth.guard";
import { ContactRepository } from "./repositories/contact.repository";
import { ContactAdminService } from "./contact-admin.service";
import { ContactAdminController } from "./contact-admin.controller";

export const createContactAdminModule = (
  rateLimiter: RateLimiterMiddleware,
  optionalAuth: OptionalAuthGuard
) => {
  const contactRepo = new ContactRepository();
  const contactAdminService = new ContactAdminService(contactRepo);
  const contactAdminController = new ContactAdminController(
    contactAdminService,
    rateLimiter,
    optionalAuth
  );

  return {
    contactAdminRouter: contactAdminController.router
  };
};
