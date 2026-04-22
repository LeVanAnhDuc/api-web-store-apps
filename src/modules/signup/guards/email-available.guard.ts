// types
import type { UserService } from "@/modules/user/user.service";
// config
import { ConflictRequestError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class EmailAvailableGuard {
  constructor(private readonly userService: UserService) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const exists = await this.userService.emailExists(email);

    if (exists) {
      Logger.warn("Email already exists", { email });
      throw new ConflictRequestError(
        t("signup:errors.emailAlreadyExists"),
        ERROR_CODES.SIGNUP_EMAIL_EXISTS
      );
    }
  }
}
