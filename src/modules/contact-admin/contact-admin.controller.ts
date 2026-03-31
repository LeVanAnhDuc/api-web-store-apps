// types
import type { Response } from "express";
import type { ContactAdminService } from "./contact-admin.service";
import type {
  SubmitContactRequest,
  AdminContactsQueryRequest,
  ContactIdParamRequest,
  UpdateContactStatusRequest
} from "@/types/modules/contact-admin";
// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

export class ContactAdminController {
  constructor(private readonly service: ContactAdminService) {}

  submit = async (req: SubmitContactRequest, res: Response): Promise<void> => {
    const data = await this.service.submitContact(req.body);
    new CreatedSuccess({
      data,
      message: "contactAdmin:success.submitted"
    }).send(req, res);
  };

  getContactList = async (
    req: AdminContactsQueryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getContactList(req.query);
    new OkSuccess({
      data,
      message: "contactAdmin:success.getContactList"
    }).send(req, res);
  };

  getContactDetail = async (
    req: ContactIdParamRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getContactDetail(req.params.id);
    new OkSuccess({
      data,
      message: "contactAdmin:success.getContactDetail"
    }).send(req, res);
  };

  updateContactStatus = async (
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
