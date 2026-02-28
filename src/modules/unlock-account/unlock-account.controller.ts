import { Router } from "express";
import type { Response } from "express";
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import type { UnlockAccountService } from "./unlock-account.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/configurations/cookie";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  unlockRequestSchema,
  unlockVerifySchema
} from "@/validators/schemas/unlock-account";

export class UnlockAccountController {
  public readonly router = Router();

  constructor(private readonly service: UnlockAccountService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/request",
      validate(unlockRequestSchema, "body"),
      asyncHandler(this.unlockRequest)
    );

    this.router.post(
      "/verify",
      (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
      validate(unlockVerifySchema, "body"),
      asyncHandler(this.unlockVerify)
    );
  }

  private unlockRequest = async (
    req: UnlockRequest,
    res: Response
  ): Promise<void> => {
    const { email } = req.body;
    const { t, language } = req;

    const result = await this.service.unlockRequest(email, t, language);

    const message = t("unlockAccount:success.unlockEmailSent");

    new OkSuccess({ data: result, message }).send(req, res);
  };

  private unlockVerify = async (
    req: UnlockVerifyRequest,
    res: Response
  ): Promise<void> => {
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
  };
}
