// types
import type { Request } from "express";
import type { UnlockRequestBody, UnlockVerifyBody } from "./types";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { LoginService } from "@/modules/login/services";
import type { UnlockAccountRepository } from "./repositories";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { UnlockRequestDto, UnlockVerifyDto } from "./dtos";
// config
import ENV from "@/config/env";
import { BadRequestError } from "@/config/responses/error";
// dtos
import { toUnlockRequestDto, toUnlockVerifyDto } from "./dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { hashValue } from "@/utils/crypto/bcrypt";
import { withRetry } from "@/utils/retry";
import { generateAuthTokensResponse } from "@/utils/token";
import { LOGIN_METHODS } from "@/constants/modules/login-history";
import {
  checkCooldown,
  checkRateLimit,
  ensureAuthExists,
  ensureTempPasswordValid,
  generateTempPassword
} from "./unlock-account.helper";

const TEMP_PASSWORD_EXPIRY_MINUTES = 15;

export class UnlockAccountService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly loginService: LoginService,
    private readonly unlockAccountRepo: UnlockAccountRepository,
    private readonly emailDispatcher: EmailDispatcher
  ) {}

  async unlockRequest(
    body: UnlockRequestBody,
    req: Request
  ): Promise<UnlockRequestDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("Processing unlock request", { email });

    await checkCooldown(this.unlockAccountRepo, email, t);
    await checkRateLimit(this.unlockAccountRepo, email, t);

    const result = await this.userService.findByEmailWithAuth(email);

    if (!result) {
      Logger.warn("Unlock request for non-existent email", { email });
      await this.unlockAccountRepo.setCooldown(email);
      return toUnlockRequestDto();
    }

    const { auth } = result;

    if (!auth.isActive) {
      Logger.warn("Unlock request for disabled account", {
        email,
        authId: auth._id
      });
      throw new BadRequestError(
        t("unlockAccount:errors.accountDisabled"),
        ERROR_CODES.UNLOCK_ACCOUNT_DISABLED
      );
    }

    const isLocked = await this.loginService.isEmailLocked(email);
    if (!isLocked) {
      Logger.info("Unlock request for non-locked account", {
        email,
        authId: auth._id
      });
      throw new BadRequestError(
        t("unlockAccount:errors.accountNotLocked"),
        ERROR_CODES.UNLOCK_ACCOUNT_NOT_LOCKED
      );
    }

    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashValue(tempPassword);
    const tempPasswordExpAt = new Date(
      Date.now() + TEMP_PASSWORD_EXPIRY_MINUTES * 60 * 1000
    );

    await this.authService.storeTempPassword(
      auth._id.toString(),
      tempPasswordHash,
      tempPasswordExpAt
    );

    Logger.info("Temporary password generated and saved", {
      email,
      authId: auth._id,
      expiresAt: tempPasswordExpAt
    });

    this.emailDispatcher.send(EmailType.UNLOCK_TEMP_PASSWORD, {
      email,
      data: {
        tempPassword,
        loginUrl: ENV.CLIENT_URL || "http://localhost:3000/login"
      },
      locale: language as I18n.Locale
    });

    await this.unlockAccountRepo.setCooldown(email);

    Logger.info("Unlock email sent successfully", { email });

    return toUnlockRequestDto();
  }

  async unlockVerify(
    body: UnlockVerifyBody,
    req: Request
  ): Promise<UnlockVerifyDto> {
    const { email, tempPassword } = body;
    const { t } = req;

    Logger.info("Processing unlock verify", { email });

    const { auth, user } = await ensureAuthExists(this.userService, email, t);

    await ensureTempPasswordValid(auth, email, tempPassword, t);

    Logger.info("Temp password verified successfully", {
      email,
      authId: auth._id
    });

    withRetry(() => this.loginService.resetFailedAttempts(email), {
      operationName: "resetFailedAttemptsAfterUnlock",
      context: { email }
    });

    await this.authService.markTempPasswordUsed(auth._id.toString());

    Logger.info("Temp password marked as used", {
      email,
      authId: auth._id
    });

    this.loginHistoryService.recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      req
    });

    Logger.info("Unlock successful - tokens generated", {
      email,
      authId: auth._id
    });

    return toUnlockVerifyDto(
      generateAuthTokensResponse({
        userId: user._id.toString(),
        authId: auth._id.toString(),
        email: user.email,
        roles: auth.roles,
        fullName: user.fullName,
        avatar: user.avatar ?? null
      })
    );
  }
}
