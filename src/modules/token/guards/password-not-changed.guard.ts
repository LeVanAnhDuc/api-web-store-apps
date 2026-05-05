// types
import type { AuthenticationDocument } from "@/modules/authentication/types";
// common
import { ForbiddenError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

const MILLISECONDS_PER_SECOND = 1000;

export class PasswordNotChangedGuard {
  assert(auth: AuthenticationDocument, payload: RefreshTokenPayload): void {
    if (!auth.passwordChangedAt || !payload.iat) return;

    const passwordChangedAtSec = Math.floor(
      auth.passwordChangedAt.getTime() / MILLISECONDS_PER_SECOND
    );

    if (payload.iat < passwordChangedAtSec) {
      Logger.warn(
        "Token refresh rejected - password changed after token issued",
        { authId: payload.authId }
      );
      throw new ForbiddenError({
        i18nMessage: (t) =>
          t("forgotPassword:errors.passwordChangedPleaseLogin"),
        code: ERROR_CODES.AUTH_PASSWORD_CHANGED
      });
    }
  }
}
