import type { Request } from "express";
import type { RefreshTokenResponse } from "@/modules/token/types";
import {
  UnauthorizedError,
  ForbiddenError
} from "@/configurations/responses/error";
import { JsonWebTokenService } from "@/services/JsonWebTokenService";
import { Logger } from "@/utils/logger";
import { generateAuthTokensResponse } from "@/services/implements/AuthToken";

const ensureRefreshTokenFromCookie = (
  req: Request,
  t: TranslateFunction
): string => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    Logger.warn("Token refresh failed - no refresh token in cookie");
    throw new UnauthorizedError(t("login:errors.refreshTokenRequired"));
  }

  return refreshToken;
};

const verifyAndExtractPayload = (
  refreshToken: string,
  t: TranslateFunction
): JwtUserPayload => {
  try {
    return JsonWebTokenService.verifyRefreshToken(refreshToken);
  } catch (error) {
    Logger.warn("Token refresh failed - invalid refresh token", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }
};

export const refreshAccessTokenService = (
  req: Request
): Partial<ResponsePattern<RefreshTokenResponse>> => {
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
};
