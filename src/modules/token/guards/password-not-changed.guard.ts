// types
import type { AuthenticationDocument } from "@/modules/authentication/types";
// config
import { ForbiddenError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

const MILLISECONDS_PER_SECOND = 1000;

export class PasswordNotChangedGuard {
  assert(
    auth: AuthenticationDocument,
    payload: RefreshTokenPayload,
    t: TranslateFunction
  ): void {
    if (!auth.passwordChangedAt || !payload.iat) return;

    const passwordChangedAtSec = Math.floor(
      auth.passwordChangedAt.getTime() / MILLISECONDS_PER_SECOND
    );

    if (payload.iat < passwordChangedAtSec) {
      Logger.warn(
        "Token refresh rejected - password changed after token issued",
        { authId: payload.authId }
      );
      throw new ForbiddenError(
        t("forgotPassword:errors.passwordChangedPleaseLogin"),
        ERROR_CODES.AUTH_PASSWORD_CHANGED
      );
    }
  }
}
