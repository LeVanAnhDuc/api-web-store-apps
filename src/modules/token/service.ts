import type { TFunction } from "i18next";
import type {
  RefreshTokenRequest,
  RefreshTokenResponse
} from "@/modules/token/types";
import { UnauthorizedError, ForbiddenError } from "@/infra/responses/error";
import { JsonWebTokenService } from "@/app/services/JsonWebTokenService";
import { Logger } from "@/infra/utils/logger";
import { TOKEN_EXPIRY } from "@/infra/configs/jwt";

const extractRefreshTokenFromCookie = (
  req: RefreshTokenRequest,
  t: TFunction
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
  t: TFunction
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

const generateNewTokens = (
  payload: JwtUserPayload
): { accessToken: string; idToken: string } => {
  const tokenPayload = {
    userId: payload.userId,
    authId: payload.authId,
    email: payload.email,
    roles: payload.roles
  };

  return {
    accessToken: JsonWebTokenService.generateAccessToken(tokenPayload),
    idToken: JsonWebTokenService.generateIdToken(tokenPayload)
  };
};
export const refreshAccessTokenService = (
  req: RefreshTokenRequest
): Partial<ResponsePattern<RefreshTokenResponse>> => {
  const { t } = req;

  const refreshToken = extractRefreshTokenFromCookie(req, t);
  const tokenPayload = verifyAndExtractPayload(refreshToken, t);
  const { accessToken, idToken } = generateNewTokens(tokenPayload);

  Logger.info("Token refresh successful", { userId: tokenPayload.userId });

  return {
    message: t("login:success.tokenRefreshed"),
    data: {
      accessToken,
      idToken,
      expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
    }
  };
};
