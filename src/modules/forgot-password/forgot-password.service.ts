import type {
  FPOtpSendRequest,
  FPOtpSendResponse,
  FPOtpVerifyRequest,
  FPVerifyResponse,
  FPMagicLinkSendRequest,
  FPMagicLinkSendResponse,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest,
  FPResetPasswordResponse
} from "@/types/modules/forgot-password";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { hashValue } from "@/utils/crypto/bcrypt";
import {
  BadRequestError,
  UnauthorizedError
} from "@/configurations/responses/error";
import type { AuthenticationRepository } from "@/repositories/authentication";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { OtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import type { MagicLinkForgotPasswordRepository } from "./repositories/magic-link-forgot-password.repository";
import type { ResetTokenRepository } from "./repositories/reset-token.repository";
import {
  sendEmailService,
  EmailType
} from "@/modules/send-email/send-email.module";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/constants/enums";
import {
  FORGOT_PASSWORD_OTP_CONFIG,
  FORGOT_PASSWORD_MAGIC_LINK_CONFIG
} from "@/constants/config";
import ENV from "@/configurations/env";

export class ForgotPasswordService {
  constructor(
    private readonly authRepo: AuthenticationRepository,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly otpRepo: OtpForgotPasswordRepository,
    private readonly magicLinkRepo: MagicLinkForgotPasswordRepository,
    private readonly resetTokenRepo: ResetTokenRepository
  ) {}

  // ──────────────────────────────────────────────
  // Send OTP
  // ──────────────────────────────────────────────

  async sendOtp(
    req: FPOtpSendRequest
  ): Promise<Partial<ResponsePattern<FPOtpSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password OTP send initiated", { email });

    await this.ensureCooldownExpired(email, t);
    await this.ensureResendLimitNotExceeded(email, t);

    const auth = await this.authRepo.findByEmail(email);

    if (!auth || !auth.isActive) {
      Logger.info(
        "Forgot password OTP - email not found or inactive (fake success)",
        { email }
      );
      return this.buildOtpSendResponse(t);
    }

    const otp = await this.otpRepo.createAndStoreOtp(email);

    withRetry(() => this.otpRepo.setRateLimits(email), {
      operationName: "setForgotPasswordOtpRateLimits",
      context: { email }
    });

    sendEmailService.send(EmailType.FORGOT_PASSWORD_OTP, {
      email,
      data: { otp, expiryMinutes: FORGOT_PASSWORD_OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Forgot password OTP send completed", {
      email,
      expiresIn: this.otpRepo.OTP_EXPIRY_SECONDS,
      cooldown: this.otpRepo.OTP_COOLDOWN_SECONDS
    });

    return this.buildOtpSendResponse(t);
  }

  // ──────────────────────────────────────────────
  // Verify OTP
  // ──────────────────────────────────────────────

  async verifyOtp(
    req: FPOtpVerifyRequest
  ): Promise<Partial<ResponsePattern<FPVerifyResponse>>> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("Forgot password OTP verification initiated", { email });

    await this.ensureOtpNotLocked(email, t);

    const auth = await this.ensureAuthExists(email, t);

    const isValid = await this.otpRepo.verify(email, otp);

    if (!isValid) await this.handleInvalidOtp(email, auth, t, req);

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.otpRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordOtpData",
      context: { email }
    });

    Logger.info("Forgot password OTP verified successfully", { email });

    return {
      message: t("forgotPassword:success.otpVerified"),
      data: {
        success: true,
        resetToken
      }
    };
  }

  // ──────────────────────────────────────────────
  // Send Magic Link
  // ──────────────────────────────────────────────

  async sendMagicLink(
    req: FPMagicLinkSendRequest
  ): Promise<Partial<ResponsePattern<FPMagicLinkSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password magic link send initiated", { email });

    await this.ensureMagicLinkCooldownExpired(email, t);
    await this.ensureMagicLinkResendLimitNotExceeded(email, t);

    const auth = await this.authRepo.findByEmail(email);

    if (!auth || !auth.isActive) {
      Logger.info(
        "Forgot password magic link - email not found or inactive (fake success)",
        { email }
      );
      return this.buildMagicLinkSendResponse(t);
    }

    const token = await this.magicLinkRepo.createAndStoreToken(email);

    withRetry(() => this.magicLinkRepo.setRateLimits(email), {
      operationName: "setForgotPasswordMagicLinkRateLimits",
      context: { email }
    });

    const magicLinkUrl = `${ENV.CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}&token=${token}&method=magic-link`;
    sendEmailService.send(EmailType.MAGIC_LINK, {
      email,
      data: {
        magicLinkUrl,
        expiryMinutes: FORGOT_PASSWORD_MAGIC_LINK_CONFIG.EXPIRY_MINUTES
      },
      locale: language as I18n.Locale
    });

    Logger.info("Forgot password magic link send completed", {
      email,
      expiresIn: this.magicLinkRepo.MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: this.magicLinkRepo.MAGIC_LINK_COOLDOWN_SECONDS
    });

    return this.buildMagicLinkSendResponse(t);
  }

  // ──────────────────────────────────────────────
  // Verify Magic Link
  // ──────────────────────────────────────────────

  async verifyMagicLink(
    req: FPMagicLinkVerifyRequest
  ): Promise<Partial<ResponsePattern<FPVerifyResponse>>> {
    const { email, token } = req.body;
    const { t } = req;

    Logger.info("Forgot password magic link verification initiated", { email });

    const auth = await this.ensureAuthExists(email, t);

    const isValid = await this.magicLinkRepo.verifyToken(email, token);

    if (!isValid) this.handleInvalidMagicLink(email, auth, req, t);

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.magicLinkRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordMagicLinkData",
      context: { email }
    });

    Logger.info("Forgot password magic link verified successfully", { email });

    return {
      message: t("forgotPassword:success.magicLinkVerified"),
      data: {
        success: true,
        resetToken
      }
    };
  }

  // ──────────────────────────────────────────────
  // Reset Password
  // ──────────────────────────────────────────────

  async resetPassword(
    req: FPResetPasswordRequest
  ): Promise<Partial<ResponsePattern<FPResetPasswordResponse>>> {
    const { email, resetToken, newPassword } = req.body;
    const { t } = req;

    Logger.info("Forgot password reset initiated", { email });

    const isValidToken = await this.resetTokenRepo.verify(email, resetToken);

    if (!isValidToken) {
      Logger.warn("Forgot password reset - invalid or expired reset token", {
        email
      });
      throw new UnauthorizedError(t("forgotPassword:errors.invalidResetToken"));
    }

    const auth = await this.ensureAuthExists(email, t);

    const hashedPassword = hashValue(newPassword);
    await this.authRepo.updatePassword(auth._id.toString(), hashedPassword);

    await this.resetTokenRepo.clear(email);

    this.loginHistoryService.recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
      req
    });

    Logger.info("Forgot password reset completed successfully", { email });

    return {
      message: t("forgotPassword:success.passwordReset"),
      data: {
        success: true
      }
    };
  }

  // ──────────────────────────────────────────────
  // Private helpers — OTP send
  // ──────────────────────────────────────────────

  private buildOtpSendResponse(
    t: TranslateFunction
  ): Partial<ResponsePattern<FPOtpSendResponse>> {
    return {
      message: t("forgotPassword:success.otpSent"),
      data: {
        success: true,
        expiresIn: this.otpRepo.OTP_EXPIRY_SECONDS,
        cooldown: this.otpRepo.OTP_COOLDOWN_SECONDS
      }
    };
  }

  private async ensureCooldownExpired(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const canSend = await this.otpRepo.checkCooldown(email);

    if (!canSend) {
      const remaining = await this.otpRepo.getCooldownRemaining(email);
      Logger.warn("Forgot password OTP cooldown not expired", {
        email,
        remaining
      });
      throw new BadRequestError(
        t("forgotPassword:errors.otpCooldown", { seconds: remaining })
      );
    }
  }

  private async ensureResendLimitNotExceeded(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const exceeded = await this.otpRepo.hasExceededResendLimit(email);

    if (exceeded) {
      Logger.warn("Forgot password OTP resend limit exceeded", { email });
      throw new BadRequestError(
        t("forgotPassword:errors.otpResendLimitExceeded")
      );
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers — OTP verify
  // ──────────────────────────────────────────────

  private async ensureAuthExists(
    email: string,
    t: TranslateFunction
  ): Promise<AuthenticationDocument> {
    const auth = await this.authRepo.findByEmail(email);

    if (!auth) {
      Logger.warn("Forgot password - authentication not found", { email });
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    return auth;
  }

  private async ensureOtpNotLocked(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const isLocked = await this.otpRepo.isLocked(email);

    if (!isLocked) return;

    const attempts = await this.otpRepo.getFailedAttemptCount(email);
    Logger.warn("Forgot password OTP verification locked", {
      email,
      attempts
    });

    throw new BadRequestError(
      t("forgotPassword:errors.otpLocked", {
        minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      })
    );
  }

  private async handleInvalidOtp(
    email: string,
    auth: AuthenticationDocument,
    t: TranslateFunction,
    req: FPOtpVerifyRequest
  ): Promise<never> {
    const attempts = await this.trackFailedOtpAttempt(email, auth, req);
    const remaining = FORGOT_PASSWORD_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new BadRequestError(
        t("forgotPassword:errors.otpLocked", {
          minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
        })
      );
    }

    throw new UnauthorizedError(
      t("forgotPassword:errors.invalidOtpWithRemaining", { remaining })
    );
  }

  private async trackFailedOtpAttempt(
    email: string,
    auth: AuthenticationDocument,
    req: FPOtpVerifyRequest
  ): Promise<number> {
    const attempts = await this.otpRepo.incrementFailedAttempts(email);

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
      req
    });

    Logger.warn("Forgot password OTP verification failed", {
      email,
      attempts
    });
    return attempts;
  }

  // ──────────────────────────────────────────────
  // Private helpers — Magic Link send
  // ──────────────────────────────────────────────

  private buildMagicLinkSendResponse(
    t: TranslateFunction
  ): Partial<ResponsePattern<FPMagicLinkSendResponse>> {
    return {
      message: t("forgotPassword:success.magicLinkSent"),
      data: {
        success: true,
        expiresIn: this.magicLinkRepo.MAGIC_LINK_EXPIRY_SECONDS,
        cooldown: this.magicLinkRepo.MAGIC_LINK_COOLDOWN_SECONDS
      }
    };
  }

  private async ensureMagicLinkCooldownExpired(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const canSend = await this.magicLinkRepo.checkCooldown(email);

    if (!canSend) {
      const remaining = await this.magicLinkRepo.getCooldownRemaining(email);
      Logger.warn("Forgot password magic link cooldown not expired", {
        email,
        remaining
      });
      throw new BadRequestError(
        t("forgotPassword:errors.magicLinkCooldown", { seconds: remaining })
      );
    }
  }

  private async ensureMagicLinkResendLimitNotExceeded(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const exceeded = await this.magicLinkRepo.hasExceededResendLimit(email);

    if (exceeded) {
      Logger.warn("Forgot password magic link resend limit exceeded", {
        email
      });
      throw new BadRequestError(
        t("forgotPassword:errors.magicLinkResendLimitExceeded")
      );
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers — Magic Link verify
  // ──────────────────────────────────────────────

  private handleInvalidMagicLink(
    email: string,
    auth: AuthenticationDocument,
    req: FPMagicLinkVerifyRequest,
    t: TranslateFunction
  ): never {
    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
      req
    });

    Logger.warn("Forgot password magic link verification failed", { email });
    throw new UnauthorizedError(t("forgotPassword:errors.invalidMagicLink"));
  }
}
