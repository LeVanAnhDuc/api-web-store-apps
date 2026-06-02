// types
import type { ChangePasswordRequest } from "./types";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { AuthTokensResponse } from "@/modules/authentication/types";
import type { WrongCurrentPasswordGuard, SamePasswordGuard } from "./guards";
// common
import { UnauthorizedError } from "@/common/exceptions";
// modules
import { generateAuthTokensResponse } from "@/modules/authentication/helpers";
import { EmailType } from "@/types/services/email";
// others
import { RequestContext } from "@/utils/request-context";
import { hashValue } from "@/utils/crypto/bcrypt";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class ChangePasswordService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly wrongCurrentPasswordGuard: WrongCurrentPasswordGuard,
    private readonly samePasswordGuard: SamePasswordGuard
  ) {}

  async changePassword(
    req: ChangePasswordRequest
  ): Promise<AuthTokensResponse> {
    const authId = RequestContext.requireAuthId();
    const { currentPassword, newPassword } = req.body;

    const auth = await this.authService.findById(authId);
    if (!auth) {
      throw new UnauthorizedError({
        i18nMessage: (t) => t("common:errors.unauthorized"),
        code: ERROR_CODES.AUTH_INVALID_TOKEN
      });
    }

    this.wrongCurrentPasswordGuard.assert(currentPassword, auth.password);
    this.samePasswordGuard.assert(currentPassword, newPassword);

    const hashedPassword = hashValue(newPassword);
    await this.authService.updatePassword(authId, hashedPassword);

    const user = await this.userService.findByAuthId(authId);
    if (!user) {
      throw new UnauthorizedError({
        i18nMessage: (t) => t("common:errors.unauthorized"),
        code: ERROR_CODES.AUTH_INVALID_TOKEN
      });
    }

    // Tokens issued AFTER passwordChangedAt is set, so the current device
    // survives while every previously-issued refresh token (other devices)
    // is rejected by PasswordNotChangedGuard at /auth/token/refresh.
    const tokens = generateAuthTokensResponse({
      userId: user._id.toString(),
      authId: auth._id.toString(),
      email: user.email,
      roles: auth.roles,
      fullName: user.fullName,
      avatar: user.avatar ?? null
    });

    // Fire-and-forget security alert (queued).
    this.emailDispatcher.send(EmailType.PASSWORD_CHANGED, {
      email: user.email,
      data: {
        changedAt: new Date().toISOString(),
        ipAddress: req.ip ?? "unknown"
      }
    });

    Logger.info("Password changed", { authId });

    return tokens;
  }
}
