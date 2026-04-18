// types
import type { Response } from "express";
import type { LoginHistoryService } from "./login-history.service";
import type {
  MyHistoryRequest,
  AllHistoryRequest
} from "@/types/modules/login-history";
// config
import { OkSuccess } from "@/config/responses/success";

export class LoginHistoryController {
  constructor(private readonly service: LoginHistoryService) {}

  getMyHistory = async (
    req: MyHistoryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getMyLoginHistory(req.user.sub, req.query);
    new OkSuccess({ data, message: "loginHistory:success.getMyHistory" }).send(
      req,
      res
    );
  };

  getAllHistory = async (
    req: AllHistoryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.getAllLoginHistory(req.query);
    new OkSuccess({
      data,
      message: "loginHistory:success.getAllHistory"
    }).send(req, res);
  };
}
