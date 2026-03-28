// libs
import { Router } from "express";
import type { Response } from "express";

// types
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import type { UnlockAccountService } from "./unlock-account.service";
import type { RateLimiterMiddleware } from "@/middlewares";

// config
import { OkSuccess } from "@/config/responses/success";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe } from "@/middlewares";

// validators
import {
  unlockRequestSchema,
  unlockVerifySchema
} from "@/validators/schemas/unlock-account";

// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class UnlockAccountController {
  public readonly router = Router();

  constructor(
    private readonly service: UnlockAccountService,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/request",
      bodyPipe(unlockRequestSchema),
      asyncHandler(this.unlockRequest)
    );

    this.router.post(
      "/verify",
      this.rl.loginByIp,
      bodyPipe(unlockVerifySchema),
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
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({ data: responseData, message }).send(req, res);
  };
}
