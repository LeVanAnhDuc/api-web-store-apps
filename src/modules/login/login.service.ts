// types
import type {
  PasswordLoginBody,
  OtpSendBody,
  OtpVerifyBody,
  MagicLinkSendBody,
  MagicLinkVerifyBody
} from "@/types/modules/login";
import type { Request } from "express";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { OtpLoginRepository } from "./repositories/otp-login.repository";
import type { MagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import type { FailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import type { LoginResponseDto, OtpSendDto, MagicLinkSendDto } from "./dtos";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
// config
import { BadRequestError } from "@/config/responses/error";
import ENV from "@/config/env";
// dtos
import { toOtpSendDto, toMagicLinkSendDto } from "./dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { LOGIN_METHODS } from "@/constants/modules/login-history";
import { LOGIN_OTP_CONFIG, MAGIC_LINK_CONFIG } from "@/constants/modules/login";
import {
  completeSuccessfulLogin,
  ensureCooldownExpired,
  ensureAuthenticationExists,
  validateAuthenticationForLogin,
  ensureLoginNotLocked,
  ensureAccountExists,
  ensureAccountActiveWithLogging,
  ensureEmailVerifiedWithLogging,
  verifyPasswordOrFail,
  ensureOtpNotLocked,
  handleInvalidOtp,
  handleInvalidMagicLink
} from "./login.helper";

export class LoginService {
  constructor(
    private readonly userService: UserService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly otpLoginRepo: OtpLoginRepository,
    private readonly magicLinkLoginRepo: MagicLinkLoginRepository,
    private readonly failedAttemptsRepo: FailedAttemptsRepository,
    private readonly emailDispatcher: EmailDispatcher
  ) {}

  async passwordLogin(
    body: PasswordLoginBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, password } = body;
    const { language, t } = req;

    Logger.info("Password login initiated", { email });

    await ensureLoginNotLocked(this.failedAttemptsRepo, email, t, language);

    const result = await this.userService.findByEmailWithAuth(email);

    ensureAccountExists(this.loginHistoryService, result, email, req, t);
    const { auth, user } = result;

    ensureAccountActiveWithLogging(
      this.loginHistoryService,
      auth,
      email,
      req,
      t
    );
    ensureEmailVerifiedWithLogging(
      this.loginHistoryService,
      auth,
      email,
      req,
      t
    );

    await verifyPasswordOrFail(
      this.failedAttemptsRepo,
      this.loginHistoryService,
      auth,
      password,
      email,
      language,
      req,
      t
    );

    withRetry(() => this.failedAttemptsRepo.resetAll(email), {
      operationName: "resetFailedLoginAttempts",
      context: { email }
    });

    return completeSuccessfulLogin(this.loginHistoryService, {
      auth,
      user,
      loginMethod: LOGIN_METHODS.PASSWORD,
      req
    });
  }

  async sendOtp(body: OtpSendBody, req: Request): Promise<OtpSendDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("Login OTP send initiated", { email });

    await ensureCooldownExpired(
      this.otpLoginRepo,
      email,
      t,
      "Login OTP cooldown not expired",
      "login:errors.otpCooldown",
      ERROR_CODES.LOGIN_OTP_COOLDOWN
    );
    await validateAuthenticationForLogin(this.userService, email, t);

    const exceeded = await this.otpLoginRepo.hasExceededResendLimit(email);
    if (exceeded) {
      Logger.warn("Login OTP resend limit exceeded", { email });
      throw new BadRequestError(
        t("login:errors.otpResendLimitExceeded"),
        ERROR_CODES.LOGIN_OTP_RESEND_LIMIT
      );
    }

    const otp = await this.otpLoginRepo.createAndStoreOtp(email);

    withRetry(() => this.otpLoginRepo.setRateLimits(email), {
      operationName: "setOtpRateLimits",
      context: { email }
    });

    this.emailDispatcher.send(EmailType.LOGIN_OTP, {
      email,
      data: { otp, expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Login OTP send completed", {
      email,
      expiresIn: this.otpLoginRepo.OTP_EXPIRY_SECONDS,
      cooldown: this.otpLoginRepo.OTP_COOLDOWN_SECONDS
    });

    return toOtpSendDto(
      this.otpLoginRepo.OTP_EXPIRY_SECONDS,
      this.otpLoginRepo.OTP_COOLDOWN_SECONDS
    );
  }

  async verifyOtp(
    body: OtpVerifyBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, otp } = body;
    const { t } = req;

    Logger.info("Login OTP verification initiated", { email });

    await ensureOtpNotLocked(this.otpLoginRepo, email, t);

    const { auth, user } = await ensureAuthenticationExists(
      this.userService,
      email,
      t
    );

    const isValid = await this.otpLoginRepo.verify(email, otp);

    if (!isValid)
      await handleInvalidOtp(
        this.otpLoginRepo,
        this.loginHistoryService,
        email,
        auth,
        t,
        req
      );

    withRetry(() => this.otpLoginRepo.cleanupAll(email), {
      operationName: "cleanupLoginOtpData",
      context: { email }
    });

    return completeSuccessfulLogin(this.loginHistoryService, {
      auth,
      user,
      loginMethod: LOGIN_METHODS.OTP,
      req
    });
  }

  async sendMagicLink(
    body: MagicLinkSendBody,
    req: Request
  ): Promise<MagicLinkSendDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("Magic link send initiated", { email });

    await ensureCooldownExpired(
      this.magicLinkLoginRepo,
      email,
      t,
      "Magic link cooldown not expired",
      "login:errors.magicLinkCooldown",
      ERROR_CODES.LOGIN_MAGIC_LINK_COOLDOWN
    );
    await validateAuthenticationForLogin(this.userService, email, t);

    const token = await this.magicLinkLoginRepo.createAndStoreToken(email);

    withRetry(() => this.magicLinkLoginRepo.setCooldownAfterSend(email), {
      operationName: "setMagicLinkCooldown",
      context: { email }
    });

    const magicLinkUrl = `${ENV.CLIENT_URL}/login/verify-magic-link?token=${token}&email=${encodeURIComponent(email)}`;
    this.emailDispatcher.send(EmailType.MAGIC_LINK, {
      email,
      data: { magicLinkUrl, expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Magic link send completed", {
      email,
      expiresIn: this.magicLinkLoginRepo.MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: this.magicLinkLoginRepo.MAGIC_LINK_COOLDOWN_SECONDS
    });

    return toMagicLinkSendDto(
      this.magicLinkLoginRepo.MAGIC_LINK_EXPIRY_SECONDS,
      this.magicLinkLoginRepo.MAGIC_LINK_COOLDOWN_SECONDS
    );
  }

  async verifyMagicLink(
    body: MagicLinkVerifyBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, token } = body;
    const { t } = req;

    Logger.info("Magic link verification initiated", { email });

    const { auth, user } = await ensureAuthenticationExists(
      this.userService,
      email,
      t
    );

    const isValid = await this.magicLinkLoginRepo.verifyToken(email, token);

    if (!isValid)
      handleInvalidMagicLink(this.loginHistoryService, email, auth, req, t);

    withRetry(() => this.magicLinkLoginRepo.cleanupAll(email), {
      operationName: "cleanupMagicLinkData",
      context: { email }
    });

    return completeSuccessfulLogin(this.loginHistoryService, {
      auth,
      user,
      loginMethod: LOGIN_METHODS.MAGIC_LINK,
      req
    });
  }

  // ──────────────────────────────────────────────
  // Public lockout operations (used by unlock-account module)
  // ──────────────────────────────────────────────

  async checkLockout(
    email: string
  ): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    return this.failedAttemptsRepo.checkLockout(email);
  }

  async resetFailedAttempts(email: string): Promise<void> {
    return this.failedAttemptsRepo.resetAll(email);
  }
}
