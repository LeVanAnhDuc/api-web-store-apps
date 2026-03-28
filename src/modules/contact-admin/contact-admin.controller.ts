import { Router } from "express";
import type { Request } from "express";
import type {
  RateLimiterMiddleware,
  AuthGuard,
  AdminGuard
} from "@/middlewares";
import type { ContactAdminService } from "./contact-admin.service";
import type {
  SubmitContactRequest,
  AdminContactsQuery
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler, asyncGuardHandler } from "@/utils/async-handler";
import { bodyPipe, paramsPipe, queryPipe } from "@/middlewares";
import {
  submitContactSchema,
  contactIdParamSchema,
  updateContactStatusSchema,
  adminListContactsQuerySchema
} from "@/validators/schemas/contact-admin";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

export class ContactAdminController {
  public readonly router = Router();
  public readonly adminRouter = Router();

  constructor(
    private readonly service: ContactAdminService,
    private readonly auth: AuthGuard,
    private readonly adminGuard: AdminGuard,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
    this.initAdminRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/submit",
      this.rl.contactByIp,
      bodyPipe(submitContactSchema),
      asyncHandler(this.submit)
    );
  }

  private initAdminRoutes() {
    this.adminRouter.get(
      "/",
      asyncGuardHandler(this.auth),
      asyncGuardHandler(this.adminGuard),
      queryPipe(adminListContactsQuerySchema),
      asyncHandler(this.getContactList)
    );

    this.adminRouter.get(
      "/:id",
      asyncGuardHandler(this.auth),
      asyncGuardHandler(this.adminGuard),
      paramsPipe(contactIdParamSchema),
      asyncHandler(this.getContactDetail)
    );

    this.adminRouter.patch(
      "/:id/status",
      asyncGuardHandler(this.auth),
      asyncGuardHandler(this.adminGuard),
      paramsPipe(contactIdParamSchema),
      bodyPipe(updateContactStatusSchema),
      asyncHandler(this.updateContactStatus)
    );
  }

  private submit = async (
    req: SubmitContactRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.submitContact(req.body);
    return { data, message, statusCode: STATUS_CODES.CREATED };
  };

  private getContactList = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const query = req.query as unknown as AdminContactsQuery;
    const data = await this.service.getContactList(query);
    return {
      data,
      message: "contactAdmin:success.getContactList",
      statusCode: STATUS_CODES.OK
    };
  };

  private getContactDetail = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.getContactDetail(req.params.id);
    return {
      data,
      message: "contactAdmin:success.getContactDetail",
      statusCode: STATUS_CODES.OK
    };
  };

  private updateContactStatus = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.updateContactStatus(
      req.params.id,
      req.body.status
    );
    return {
      data,
      message: "contactAdmin:success.updateContactStatus",
      statusCode: STATUS_CODES.OK
    };
  };
}
