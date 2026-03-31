// types
import type { RefreshTokenDto } from "./dtos";
// config
import { UnauthorizedError, ForbiddenError } from "@/config/responses/error";
// dtos
import { toRefreshTokenDto } from "./dtos";
// others
import { generateAuthTokensResponse, verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";

export class TokenService {
  refreshAccessToken(
    refreshToken: string | undefined,
    t: TranslateFunction
  ): RefreshTokenDto {
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

    const tokens = generateAuthTokensResponse({
      userId: tokenPayload.userId,
      authId: tokenPayload.authId,
      email: tokenPayload.email,
      roles: tokenPayload.roles,
      fullName: tokenPayload.fullName,
      avatar: tokenPayload.avatar
    });

    return toRefreshTokenDto(tokens);
  }
}
