// types
import type { UserDocument } from "@/modules/user/types";
// config
import { ForbiddenError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

type UserForToken = {
  _id: UserDocument["_id"];
  email: string;
  fullName: string;
  avatar?: string | null;
};

export class UserExistsGuard {
  assert(
    user: UserForToken | null,
    authId: string,
    t: TranslateFunction
  ): asserts user is UserForToken {
    if (!user) {
      Logger.warn("Token refresh rejected - user profile not found", {
        authId
      });
      throw new ForbiddenError(
        t("login:errors.invalidRefreshToken"),
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }
  }
}
