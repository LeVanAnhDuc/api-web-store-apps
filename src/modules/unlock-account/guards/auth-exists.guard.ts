// types
import type { UserService } from "@/modules/user/user.service";
import type { UserWithAuth } from "@/modules/user/types";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class AuthExistsGuard {
  constructor(private readonly userService: UserService) {}

  tryFind(email: string): Promise<UserWithAuth | null> {
    return this.userService.findByEmailWithAuth(email);
  }

  async assert(email: string, t: TranslateFunction): Promise<UserWithAuth> {
    const result = await this.tryFind(email);

    if (!result) {
      Logger.warn("Unlock verify failed - account not found", { email });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword"),
        ERROR_CODES.UNLOCK_AUTH_NOT_FOUND
      );
    }

    return result;
  }
}
