import type { Request } from "express";
import type { RefreshTokenResponse } from "@/types/modules/token";
import { generateAuthTokensResponse, verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";
import { UnauthorizedError, ForbiddenError } from "@/config/responses/error";

export class TokenService {
  refreshAccessToken(req: Request): RefreshTokenResponse {
    const { t } = req;

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      Logger.warn("Token refresh failed - no refresh token in cookie");
      throw new UnauthorizedError(t("login:errors.refreshTokenRequired"));
    }

    let tokenPayload: JwtUserPayload;
    try {
      tokenPayload = verifyRefreshToken(refreshToken);
    } catch (error) {
      Logger.warn("Token refresh failed - invalid refresh token", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
    }

    Logger.info("Token refresh successful", { userId: tokenPayload.userId });

    return generateAuthTokensResponse({
      userId: tokenPayload.userId,
      authId: tokenPayload.authId,
      email: tokenPayload.email,
      roles: tokenPayload.roles,
      fullName: tokenPayload.fullName,
      avatar: tokenPayload.avatar
    });
  }
}
