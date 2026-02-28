import type { Request } from "express";
import {
  UnauthorizedError,
  ForbiddenError
} from "@/configurations/responses/error";
import { verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";

export const ensureRefreshTokenFromCookie = (
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

export const verifyAndExtractPayload = (
  refreshToken: string,
  t: TranslateFunction
): JwtUserPayload => {
  try {
    return verifyRefreshToken(refreshToken);
  } catch (error) {
    Logger.warn("Token refresh failed - invalid refresh token", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }
};
