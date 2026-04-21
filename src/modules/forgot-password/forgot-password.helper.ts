// types
import type { FPOtpVerifyRequest, FPMagicLinkVerifyRequest } from "./types";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { UserWithAuth } from "@/types/modules/user";
import type {
  OtpForgotPasswordRepository,
  MagicLinkForgotPasswordRepository
} from "./repositories";
// config
import { BadRequestError, UnauthorizedError } from "@/config/responses/error";
import ENV from "@/config/env";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS
} from "@/constants/modules/login-history";
import {
  FORGOT_PASSWORD_OTP_CONFIG,
  FORGOT_PASSWORD_MAGIC_LINK_CONFIG
} from "./constants";

export async function ensureOtpCooldownExpired(
  otpRepo: OtpForgotPasswordRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const canSend = await otpRepo.checkCooldown(email);

  if (!canSend) {
    const remaining = await otpRepo.getCooldownRemaining(email);
    Logger.warn("Forgot password OTP cooldown not expired", {
      email,
      remaining
    });
    throw new BadRequestError(
      t("forgotPassword:errors.otpCooldown", { seconds: remaining }),
      ERROR_CODES.FORGOT_PASSWORD_OTP_COOLDOWN
    );
  }
}

export async function ensureOtpResendLimitNotExceeded(
  otpRepo: OtpForgotPasswordRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const exceeded = await otpRepo.hasExceededResendLimit(email);

  if (exceeded) {
    Logger.warn("Forgot password OTP resend limit exceeded", { email });
    throw new BadRequestError(
      t("forgotPassword:errors.otpResendLimitExceeded"),
      ERROR_CODES.FORGOT_PASSWORD_OTP_RESEND_LIMIT
    );
  }
}

// ──────────────────────────────────────────────
// OTP verify helpers
// ──────────────────────────────────────────────

export async function ensureAuthExists(
  userService: UserService,
  email: string,
  t: TranslateFunction
): Promise<UserWithAuth> {
  const result = await userService.findByEmailWithAuth(email);

  if (!result) {
    Logger.warn("Forgot password - authentication not found", { email });
    throw new UnauthorizedError(
      t("common:errors.unauthorized"),
      ERROR_CODES.FORGOT_PASSWORD_AUTH_NOT_FOUND
    );
  }

  return result;
}

export async function ensureOtpNotLocked(
  otpRepo: OtpForgotPasswordRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const isLocked = await otpRepo.isLocked(email);

  if (!isLocked) return;

  const attempts = await otpRepo.getFailedAttemptCount(email);
  Logger.warn("Forgot password OTP verification locked", { email, attempts });

  throw new BadRequestError(
    t("forgotPassword:errors.otpLocked", {
      minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    }),
    ERROR_CODES.FORGOT_PASSWORD_OTP_LOCKED
  );
}

export async function handleInvalidOtp(
  otpRepo: OtpForgotPasswordRepository,
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction,
  req: FPOtpVerifyRequest
): Promise<never> {
  const attempts = await trackFailedOtpAttempt(
    otpRepo,
    loginHistoryService,
    email,
    auth,
    req
  );
  const remaining = FORGOT_PASSWORD_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

  if (remaining <= 0) {
    throw new BadRequestError(
      t("forgotPassword:errors.otpLocked", {
        minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      }),
      ERROR_CODES.FORGOT_PASSWORD_OTP_LOCKED
    );
  }

  throw new UnauthorizedError(
    t("forgotPassword:errors.invalidOtpWithRemaining", { remaining }),
    ERROR_CODES.FORGOT_PASSWORD_OTP_INVALID
  );
}

async function trackFailedOtpAttempt(
  otpRepo: OtpForgotPasswordRepository,
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  req: FPOtpVerifyRequest
): Promise<number> {
  const attempts = await otpRepo.incrementFailedAttempts(email);

  loginHistoryService.recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
    req
  });

  Logger.warn("Forgot password OTP verification failed", { email, attempts });
  return attempts;
}

// ──────────────────────────────────────────────
// Magic link send helpers
// ──────────────────────────────────────────────

export function sendMagicLinkEmail(
  emailDispatcher: EmailDispatcher,
  email: string,
  token: string,
  language: string
): void {
  const magicLinkUrl = `${ENV.CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}&token=${token}&method=magic-link`;
  emailDispatcher.send(EmailType.MAGIC_LINK, {
    email,
    data: {
      magicLinkUrl,
      expiryMinutes: FORGOT_PASSWORD_MAGIC_LINK_CONFIG.EXPIRY_MINUTES
    },
    locale: language as I18n.Locale
  });
}

export async function ensureMagicLinkCooldownExpired(
  magicLinkRepo: MagicLinkForgotPasswordRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const canSend = await magicLinkRepo.checkCooldown(email);

  if (!canSend) {
    const remaining = await magicLinkRepo.getCooldownRemaining(email);
    Logger.warn("Forgot password magic link cooldown not expired", {
      email,
      remaining
    });
    throw new BadRequestError(
      t("forgotPassword:errors.magicLinkCooldown", { seconds: remaining }),
      ERROR_CODES.FORGOT_PASSWORD_MAGIC_LINK_COOLDOWN
    );
  }
}

export async function ensureMagicLinkResendLimitNotExceeded(
  magicLinkRepo: MagicLinkForgotPasswordRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const exceeded = await magicLinkRepo.hasExceededResendLimit(email);

  if (exceeded) {
    Logger.warn("Forgot password magic link resend limit exceeded", { email });
    throw new BadRequestError(
      t("forgotPassword:errors.magicLinkResendLimitExceeded"),
      ERROR_CODES.FORGOT_PASSWORD_MAGIC_LINK_RESEND_LIMIT
    );
  }
}

// ──────────────────────────────────────────────
// Magic link verify helpers
// ──────────────────────────────────────────────

export function handleInvalidMagicLink(
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  req: FPMagicLinkVerifyRequest,
  t: TranslateFunction
): never {
  loginHistoryService.recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
    req
  });

  Logger.warn("Forgot password magic link verification failed", { email });
  throw new UnauthorizedError(
    t("forgotPassword:errors.invalidMagicLink"),
    ERROR_CODES.FORGOT_PASSWORD_MAGIC_LINK_INVALID
  );
}
