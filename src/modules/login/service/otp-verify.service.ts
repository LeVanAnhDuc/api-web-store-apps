/**
 * OTP Verify Service
 * Use Case: User verifies OTP for passwordless login
 *
 * Business Flow:
 * 1. Check if OTP verification is locked due to failed attempts
 * 2. Verify OTP
 * 3. On success: Generate tokens, cleanup OTP data, record history
 * 4. On failure: Increment failed attempts, check for lockout
 *
 * Rate Limiting: Handled by middleware
 * Validation: Handled by schema layer
 */

// libs
import i18next from "@/i18n";

// types
import type {
  OtpVerifyRequest,
  LoginResponse
} from "@/shared/types/modules/login";

// errors
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";

// utils
import { Logger } from "@/core/utils/logger";

// repository
import { findAuthByEmail } from "@/modules/login/repository";

// store
import {
  verifyLoginOtp,
  isLoginOtpLocked,
  getFailedLoginOtpAttempts,
  incrementFailedLoginOtpAttempts,
  cleanupLoginOtpData
} from "@/modules/login/utils/store";

// shared
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";

// constants
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS,
  LOGIN_OTP_CONFIG
} from "@/shared/constants/modules/session";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

const ensureNotLocked = async (
  email: string,
  language: string
): Promise<void> => {
  const isLocked = await isLoginOtpLocked(email);

  if (isLocked) {
    const attempts = await getFailedLoginOtpAttempts(email);
    Logger.warn("Login OTP verification locked", { email, attempts });
    throw new BadRequestError(
      i18next.t("login:errors.otpLocked", {
        minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
        lng: language
      })
    );
  }
};

// =============================================================================
// Main Service
// =============================================================================

export const verifyLoginOtpService = async (
  req: OtpVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  Logger.info("Login OTP verification initiated", { email });

  await ensureNotLocked(email, language);

  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("OTP verification failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidOtp"));
  }

  const isValid = await verifyLoginOtp(email, otp);

  if (!isValid) {
    const attempts = await incrementFailedLoginOtpAttempts(email);

    recordFailedLogin({
      userId: auth._id,
      loginMethod: LOGIN_METHODS.OTP,
      failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
      req
    });

    Logger.warn("Login OTP verification failed - invalid OTP", {
      email,
      attempts
    });

    const remaining = LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new BadRequestError(
        i18next.t("login:errors.otpLocked", {
          minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
          lng: language
        })
      );
    }

    throw new UnauthorizedError(
      i18next.t("login:errors.invalidOtpWithRemaining", {
        remaining,
        lng: language
      })
    );
  }

  await cleanupLoginOtpData(email);

  const loginResponse = generateLoginTokens(auth);

  updateLastLogin(auth._id.toString());

  recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.OTP,
    req
  });

  Logger.info("Login OTP verification successful", {
    email,
    userId: auth._id.toString()
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: loginResponse
  };
};
