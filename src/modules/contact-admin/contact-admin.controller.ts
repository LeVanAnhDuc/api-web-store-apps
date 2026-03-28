// libs
import { Router } from "express";
import type { RequestHandler, Response } from "express";
// types
import type { RateLimiterMiddleware } from "@/middlewares";
import type { ContactAdminService } from "./contact-admin.service";
import type {
  SubmitContactRequest,
  AdminContactsQueryRequest,
  ContactIdParamRequest,
  UpdateContactStatusRequest
} from "@/types/modules/contact-admin";
// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";
// middlewares
import { bodyPipe, paramsPipe, queryPipe } from "@/middlewares";
// validators
import {
  submitContactSchema,
  contactIdParamSchema,
  updateContactStatusSchema,
  adminListContactsQuerySchema
} from "@/validators/schemas/contact-admin";
// others
import { asyncHandler } from "@/utils/async-handler";

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
    req: SubmitContactRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.submitContact(req.body);
    new CreatedSuccess({
      data,
      message: "contactAdmin:success.submitted"
    }).send(req, res);
  };

  private getContactList = async (
    req: AdminContactsQueryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getContactList(req.query);
    new OkSuccess({
      data,
      message: "contactAdmin:success.getContactList"
    }).send(req, res);
  };

  private getContactDetail = async (
    req: ContactIdParamRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getContactDetail(req.params.id);
    new OkSuccess({
      data,
      message: "contactAdmin:success.getContactDetail"
    }).send(req, res);
  };

  private updateContactStatus = async (
    req: UpdateContactStatusRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.updateContactStatus(
      req.params.id,
      req.body.status
    );
    new OkSuccess({
      data,
      message: "contactAdmin:success.updateContactStatus"
    }).send(req, res);
  };
}
