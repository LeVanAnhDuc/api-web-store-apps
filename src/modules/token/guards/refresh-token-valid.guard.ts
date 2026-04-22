// config
import { ForbiddenError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";

export class RefreshTokenValidGuard {
  assert(token: string, t: TranslateFunction): RefreshTokenPayload {
    try {
      return verifyRefreshToken(token);
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
