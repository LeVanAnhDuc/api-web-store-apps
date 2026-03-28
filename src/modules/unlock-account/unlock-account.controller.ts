import { Router } from "express";
import type {
  UnlockRequest,
  UnlockVerifyRequest
} from "@/types/modules/unlock-account";
import type { HandlerResult } from "@/types/http";
import type { UnlockAccountService } from "./unlock-account.service";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter";
import { asyncHandler } from "@/utils/async-handler";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";
import { validate } from "@/middlewares";
import {
  unlockRequestSchema,
  unlockVerifySchema
} from "@/validators/schemas/unlock-account";
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
      validate(unlockRequestSchema, "body"),
      asyncHandler(this.unlockRequest)
    );

    this.router.post(
      "/verify",
      this.rl.loginByIp,
      validate(unlockVerifySchema, "body"),
      asyncHandler(this.unlockVerify)
    );
  }

  private unlockRequest = async (
    req: UnlockRequest
  ): Promise<HandlerResult> => {
    const { email } = req.body;
    const { t, language } = req;

    const result = await this.service.unlockRequest(email, t, language);
    const message = t("unlockAccount:success.unlockEmailSent");

    return { data: result, message };
  };

  private unlockVerify = async (
    req: UnlockVerifyRequest
  ): Promise<HandlerResult> => {
    const { t } = req;

    const result = await this.service.unlockVerify(req);
    const message = t("unlockAccount:success.accountUnlocked");

    const { refreshToken, ...responseData } = result;

    return {
      data: responseData,
      message,
      cookies: refreshToken
        ? [
            {
              name: REFRESH_TOKEN,
              value: refreshToken,
              options: REFRESH_TOKEN_COOKIE_OPTIONS
            }
          ]
        : undefined
    };
  };
}
