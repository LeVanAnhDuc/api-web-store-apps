import { Router } from "express";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import type { OptionalAuthGuard } from "@/middlewares/optional-auth.guard";
import type { ContactAdminService } from "./contact-admin.service";
import type { SubmitContactRequest } from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
import { submitContactSchema } from "@/validators/schemas/contact-admin";
import { uploadContactFiles } from "@/middlewares/file-upload";

export class ContactAdminController {
  public readonly router = Router();

  constructor(
    private readonly service: ContactAdminService,
    private readonly rl: RateLimiterMiddleware,
    private readonly optionalAuth: OptionalAuthGuard
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/submit",
      this.rl.contactByIp,
      this.optionalAuth.middleware,
      uploadContactFiles,
      validate(submitContactSchema, "body"),
      asyncHandler(this.submit)
    );
  }

  private submit = async (
    req: SubmitContactRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.submitContact(req);
    return { data, message, statusCode: STATUS_CODES.CREATED };
  };
}
