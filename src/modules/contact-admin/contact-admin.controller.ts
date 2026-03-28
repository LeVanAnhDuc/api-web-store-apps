import { Router } from "express";
import type { RequestHandler } from "express";
import type { RateLimiterMiddleware } from "@/middlewares";
import type { ContactAdminService } from "./contact-admin.service";
import type {
  SubmitContactRequest,
  AdminContactsQueryRequest,
  ContactIdParamRequest,
  UpdateContactStatusRequest
} from "@/types/modules/contact-admin";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler } from "@/utils/async-handler";
import { bodyPipe, paramsPipe, queryPipe } from "@/middlewares";
import {
  submitContactSchema,
  contactIdParamSchema,
  updateContactStatusSchema,
  adminListContactsQuerySchema
} from "@/validators/schemas/contact-admin";

export class ContactAdminController {
  public readonly router = Router();
  public readonly adminRouter = Router();

  constructor(
    private readonly service: ContactAdminService,
    private readonly authGuard: RequestHandler,
    private readonly adminGuard: RequestHandler,
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
      this.authGuard,
      this.adminGuard,
      queryPipe(adminListContactsQuerySchema),
      asyncHandler(this.getContactList)
    );

    this.adminRouter.get(
      "/:id",
      this.authGuard,
      this.adminGuard,
      paramsPipe(contactIdParamSchema),
      asyncHandler(this.getContactDetail)
    );

    this.adminRouter.patch(
      "/:id/status",
      this.authGuard,
      this.adminGuard,
      paramsPipe(contactIdParamSchema),
      bodyPipe(updateContactStatusSchema),
      asyncHandler(this.updateContactStatus)
    );
  }

  private submit = async (
    req: SubmitContactRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.submitContact(req.body);

    return {
      data,
      message: "contactAdmin:success.submitted",
      statusCode: STATUS_CODES.CREATED
    };
  };

  private getContactList = async (
    req: AdminContactsQueryRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.getContactList(req.query);

    return {
      data,
      message: "contactAdmin:success.getContactList",
      statusCode: STATUS_CODES.OK
    };
  };

  private getContactDetail = async (
    req: ContactIdParamRequest
  ): Promise<HandlerResult> => {
    const data = await this.service.getContactDetail(req.params.id);

    return {
      data,
      message: "contactAdmin:success.getContactDetail",
      statusCode: STATUS_CODES.OK
    };
  };

  private updateContactStatus = async (
    req: UpdateContactStatusRequest
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
