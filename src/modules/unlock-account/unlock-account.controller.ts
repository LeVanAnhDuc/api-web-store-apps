// libs
import type { Response } from "express";
// types
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import type { UnlockAccountService } from "./unlock-account.service";
// config
import { OkSuccess } from "@/config/responses/success";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";
// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class UnlockAccountController {
  constructor(private readonly service: UnlockAccountService) {}

  unlockRequest = async (req: UnlockRequest, res: Response): Promise<void> => {
    const data = await this.service.unlockRequest(
      req.body.email,
      req.t,
      req.language
    );
    new OkSuccess({
      data,
      message: "unlockAccount:success.unlockEmailSent"
    }).send(req, res);
  };

  unlockVerify = async (
    req: UnlockVerifyRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.unlockVerify(req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({
      data: responseData,
      message: "unlockAccount:success.accountUnlocked"
    }).send(req, res);
  };
}
