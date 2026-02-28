import type { Response } from "express";
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import { unlockAccountService } from "./service/unlock-account.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/configurations/cookie";

class UnlockAccountController {
  constructor(private readonly service: typeof unlockAccountService) {}

  unlockRequest = asyncHandler(
    async (req: UnlockRequest, res: Response): Promise<void> => {
      const { email } = req.body;
      const { t, language } = req;

      const result = await this.service.unlockRequest(email, t, language);

      const message = t("unlockAccount:success.unlockEmailSent");

      new OkSuccess({ data: result, message }).send(req, res);
    }
  );

  unlockVerify = asyncHandler(
    async (req: UnlockVerifyRequest, res: Response): Promise<void> => {
      const { t } = req;

      const result = await this.service.unlockVerify(req);

      const message = t("unlockAccount:success.accountUnlocked");

      const { refreshToken, ...responseData } = result;

      if (refreshToken) {
        res.cookie(
          COOKIE_NAMES.REFRESH_TOKEN,
          refreshToken,
          REFRESH_TOKEN_COOKIE_OPTIONS
        );
      }

      new OkSuccess({ data: responseData, message }).send(req, res);
    }
  );
}

export const unlockAccountController = new UnlockAccountController(
  unlockAccountService
);
