import type { Request } from "express";
import type { RefreshTokenResponse } from "@/types/modules/token";
import { generateAuthTokensResponse } from "@/utils/token";
import { Logger } from "@/utils/logger";
import {
  ensureRefreshTokenFromCookie,
  verifyAndExtractPayload
} from "./helpers";

export class TokenService {
  refreshAccessToken(
    req: Request
  ): Partial<ResponsePattern<RefreshTokenResponse>> {
    const { t } = req;

    const refreshToken = ensureRefreshTokenFromCookie(req, t);
    const tokenPayload = verifyAndExtractPayload(refreshToken, t);

    Logger.info("Token refresh successful", { userId: tokenPayload.userId });

    return {
      message: t("login:success.tokenRefreshed"),
      data: generateAuthTokensResponse({
        userId: tokenPayload.userId,
        authId: tokenPayload.authId,
        email: tokenPayload.email,
        roles: tokenPayload.roles
      })
    };
  }
}
