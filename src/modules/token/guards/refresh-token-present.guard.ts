// common
import { UnauthorizedError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class RefreshTokenPresentGuard {
  assert(
    token: string | undefined,
    t: TranslateFunction
  ): asserts token is string {
    if (!token) {
      Logger.warn("Token refresh failed - no refresh token in cookie");
      throw new UnauthorizedError(
        t("login:errors.refreshTokenRequired"),
        ERROR_CODES.REFRESH_TOKEN_REQUIRED
      );
    }
  }
}
