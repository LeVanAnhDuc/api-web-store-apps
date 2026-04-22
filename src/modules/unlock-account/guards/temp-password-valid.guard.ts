// types
import type { AuthenticationDocument } from "@/modules/authentication/types";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";

export class TempPasswordValidGuard {
  async assert(
    auth: AuthenticationDocument,
    email: string,
    tempPassword: string,
    t: TranslateFunction
  ): Promise<void> {
    if (!auth.tempPasswordHash) {
      Logger.warn("Unlock verify failed - no temp password set", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword"),
        ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
      );
    }

    if (!auth.tempPasswordExpAt || auth.tempPasswordExpAt < new Date()) {
      Logger.warn("Unlock verify failed - temp password expired", {
        email,
        authId: auth._id,
        expiredAt: auth.tempPasswordExpAt
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.tempPasswordExpired"),
        ERROR_CODES.UNLOCK_TEMP_PASSWORD_EXPIRED
      );
    }

    if (auth.tempPasswordUsed) {
      Logger.warn("Unlock verify failed - temp password already used", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword"),
        ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
      );
    }

    const isValid = await isValidHashedValue(
      tempPassword,
      auth.tempPasswordHash
    );
    if (!isValid) {
      Logger.warn("Unlock verify failed - invalid temp password", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword"),
        ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
      );
    }
  }
}
