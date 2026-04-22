// types
import type { Request } from "express";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { PasswordLoginBody } from "../types";
import type { FailedAttemptsRepository } from "../repositories";
import type { LoginResponseDto } from "../dtos";
import type {
  AccountExistsGuard,
  AccountActiveGuard,
  EmailVerifiedGuard,
  PasswordLockoutGuard
} from "../guards";
import type { LoginAuditService } from "../services/login-audit.service";
import type { LoginCompletionService } from "../services/login-completion.service";
// config
import {
  TooManyRequestsError,
  UnauthorizedError
} from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { formatDuration } from "../helpers";
import { LOGIN_METHODS } from "@/modules/login-history/constants";
import { LOGIN_LOCKOUT } from "../constants";

export class PasswordLoginStrategy {
  constructor(
    private readonly accountExistsGuard: AccountExistsGuard,
    private readonly accountActiveGuard: AccountActiveGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly passwordLockoutGuard: PasswordLockoutGuard,
    private readonly failedAttemptsRepo: FailedAttemptsRepository,
    private readonly audit: LoginAuditService,
    private readonly completion: LoginCompletionService
  ) {}

  async authenticate(
    body: PasswordLoginBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, password } = body;
    const { language, t } = req;

    Logger.info("Password login initiated", { email });

    await this.passwordLockoutGuard.assert(email, language, t);

    const { auth, user } =
      await this.accountExistsGuard.assertWithCredentialAudit(email, req, t);

    this.accountActiveGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.PASSWORD,
      req,
      t
    );
    this.emailVerifiedGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.PASSWORD,
      req,
      t
    );

    await this.verifyPasswordOrFail(auth, password, email, language, req, t);

    withRetry(() => this.failedAttemptsRepo.resetAll(email), {
      operationName: "resetFailedLoginAttempts",
      context: { email }
    });

    return this.completion.complete({
      auth,
      user,
      method: LOGIN_METHODS.PASSWORD,
      req
    });
  }

  private async verifyPasswordOrFail(
    auth: AuthenticationDocument,
    password: string,
    email: string,
    language: string,
    req: Request,
    t: TranslateFunction
  ): Promise<void> {
    if (isValidHashedValue(password, auth.password)) return;

    const { attemptCount, lockoutSeconds } =
      await this.failedAttemptsRepo.trackAttempt(email);
    this.audit.recordInvalidPassword({ auth, email, attemptCount, req });

    if (attemptCount >= LOGIN_LOCKOUT.MAX_ATTEMPTS && lockoutSeconds > 0) {
      const timeMessage = formatDuration(lockoutSeconds, language);
      throw new TooManyRequestsError(
        t("login:errors.accountLocked", {
          attempts: attemptCount,
          time: timeMessage
        }),
        ERROR_CODES.LOGIN_ACCOUNT_LOCKED
      );
    }

    throw new UnauthorizedError(
      t("login:errors.invalidCredentials"),
      ERROR_CODES.LOGIN_INVALID_CREDENTIALS
    );
  }
}
