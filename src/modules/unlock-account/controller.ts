import type { Response } from "express";
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/configurations/cookie";
import { handleUnlockRequest } from "./service/unlock-request.service";
import { handleUnlockVerify } from "./service/unlock-verify.service";

export const unlockRequestController = asyncHandler(
  async (req: UnlockRequest, res: Response): Promise<void> => {
    const { email } = req.body;
    const { t, language } = req;

    const result = await handleUnlockRequest(email, t, language);

    const message = t("unlockAccount:success.unlockEmailSent");

    new OkSuccess({ data: result, message }).send(req, res);
  }
);

export const unlockVerifyController = asyncHandler(
  async (req: UnlockVerifyRequest, res: Response): Promise<void> => {
    const { t } = req;

    const result = await handleUnlockVerify(req);

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
