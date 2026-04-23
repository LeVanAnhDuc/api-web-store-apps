// types
import type {
  MyHistoryRequest,
  AllHistoryRequest
} from "@/modules/login-history/types";
import type { Response } from "express";
import type { LoginHistoryService } from "./login-history.service";
// common
import { OkSuccess } from "@/common/responses";

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
