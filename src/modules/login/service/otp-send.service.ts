/**
 * OTP Send Service
 * Use Case: User requests OTP for passwordless login
 *
 * Business Flow:
 * 1. Ensure cooldown period has expired
 * 2. Ensure email exists and account is active
 * 3. Check resend limit
 * 4. Generate and store new OTP (hashed)
 * 5. Start cooldown period
 * 6. Send OTP email (async, fire-and-forget)
 *
 * Rate Limiting: Handled by middleware (IP + Email)
 * Validation: Handled by schema layer
 */

// libs
import i18next from "@/i18n";

// types
import type { TFunction } from "i18next";
import type {
  OtpSendRequest,
  OtpSendResponse
} from "@/shared/types/modules/login";

// errors
import { BadRequestError, UnauthorizedError } from "@/core/responses/error";

// utils
import { Logger } from "@/core/utils/logger";

// repository
import { findAuthByEmail } from "@/modules/login/repository";

// store
import {
  checkLoginOtpCooldown,
  getLoginOtpCooldownRemaining,
  setLoginOtpCooldown,
  createAndStoreLoginOtp,
  deleteLoginOtp,
  incrementLoginOtpResendCount,
  hasExceededLoginOtpResendLimit
} from "@/modules/login/utils/store";

// notifier
import { notifyLoginOtpByEmail } from "@/modules/login/notifier";

// utils
import { generateLoginOtp } from "@/modules/login/utils/otp";

// constants
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

// =============================================================================
// Configuration
// =============================================================================

const TIME_OTP_EXPIRES = LOGIN_OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_OTP_COOLDOWN = LOGIN_OTP_CONFIG.COOLDOWN_SECONDS;

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

const ensureCooldownExpired = async (
  email: string,
  language: string
): Promise<void> => {
  const canSend = await checkLoginOtpCooldown(email);

  if (!canSend) {
    const remaining = await getLoginOtpCooldownRemaining(email);
    Logger.warn("Login OTP cooldown not expired", { email, remaining });
    throw new BadRequestError(
      i18next.t("login:errors.otpCooldown", {
        seconds: remaining,
        lng: language
      })
    );
  }
};

const ensureEmailExists = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("Login OTP requested for non-existent email", { email });
    throw new UnauthorizedError(t("login:errors.invalidEmail"));
  }

  if (!auth.isActive) {
    Logger.warn("Login OTP requested for inactive account", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }

  if (!auth.verifiedEmail) {
    Logger.warn("Login OTP requested for unverified email", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }
};

const ensureResendLimitNotExceeded = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exceeded = await hasExceededLoginOtpResendLimit(email);

  if (exceeded) {
    Logger.warn("Login OTP resend limit exceeded", { email });
    throw new BadRequestError(t("login:errors.otpResendLimitExceeded"));
  }
};

// =============================================================================
// Business Operations
// =============================================================================

const createNewOtp = async (email: string): Promise<string> => {
  const otp = generateLoginOtp();

  // Delete existing OTP first (idempotency)
  await deleteLoginOtp(email);
  await createAndStoreLoginOtp(email, otp, TIME_OTP_EXPIRES);

  Logger.debug("Login OTP created and stored", {
    email,
    expiresInSeconds: TIME_OTP_EXPIRES
  });

  return otp;
};

const startCooldown = async (email: string): Promise<void> => {
  await setLoginOtpCooldown(email, TIME_OTP_COOLDOWN);

  Logger.debug("Login OTP cooldown started", {
    email,
    cooldownSeconds: TIME_OTP_COOLDOWN
  });
};

// =============================================================================
// Main Service
// =============================================================================

export const sendLoginOtp = async (
  req: OtpSendRequest
): Promise<Partial<ResponsePattern<OtpSendResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("Login OTP send initiated", { email });

  await ensureCooldownExpired(email, language);
  await ensureEmailExists(email, t);
  await ensureResendLimitNotExceeded(email, t);

  const otp = await createNewOtp(email);

  await startCooldown(email);

  await incrementLoginOtpResendCount(email, TIME_OTP_EXPIRES);

  notifyLoginOtpByEmail(email, otp, language as I18n.Locale);

  Logger.info("Login OTP send completed", {
    email,
    expiresIn: TIME_OTP_EXPIRES,
    cooldown: TIME_OTP_COOLDOWN
  });

  return {
    message: t("login:success.otpSent"),
    data: {
      success: true,
      expiresIn: TIME_OTP_EXPIRES,
      cooldown: TIME_OTP_COOLDOWN
    }
  };
};
