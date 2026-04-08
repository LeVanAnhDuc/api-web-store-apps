// types
import type { RefreshTokenDto } from "./dtos";
// config
import { UnauthorizedError, ForbiddenError } from "@/config/responses/error";
// dtos
import { toRefreshTokenDto } from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { generateAuthTokensResponse, verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";

export class TokenService {
  refreshAccessToken(
    refreshToken: string | undefined,
    t: TranslateFunction
  ): RefreshTokenDto {
    if (!refreshToken) {
      Logger.warn("Token refresh failed - no refresh token in cookie");
      throw new UnauthorizedError(
        t("login:errors.refreshTokenRequired"),
        ERROR_CODES.REFRESH_TOKEN_REQUIRED
      );
    }

    try {
      const tokenPayload = verifyRefreshToken<JwtTokenPayload>(refreshToken);

      const authTokensResponse = generateAuthTokensResponse({
        userId: tokenPayload.userId,
        authId: tokenPayload.authId,
        email: tokenPayload.email,
        roles: tokenPayload.roles,
        fullName: tokenPayload.fullName,
        avatar: tokenPayload.avatar
      });

      Logger.info("Token refresh successful", { userId: tokenPayload.userId });

      return toRefreshTokenDto(authTokensResponse);
    } catch (error) {
      Logger.warn("Token refresh failed - invalid refresh token", {
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw new ForbiddenError(
        t("login:errors.invalidRefreshToken"),
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }
  }
}
