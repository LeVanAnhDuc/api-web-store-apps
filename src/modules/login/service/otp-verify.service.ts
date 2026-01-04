import i18next from "@/i18n";
import type { TFunction } from "i18next";
import type {
  OtpVerifyRequest,
  LoginResponse
} from "@/shared/types/modules/login";
import type { AuthDocument } from "@/shared/types/modules/auth";
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";
import { Logger } from "@/core/utils/logger";
import { findAuthByEmail } from "@/modules/login/repository";
import {
  verifyLoginOtp,
  isLoginOtpLocked,
  getFailedLoginOtpAttempts,
  incrementFailedLoginOtpAttempts,
  cleanupLoginOtpData
} from "@/modules/login/utils/store";
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";
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

  if (!isLocked) return;

  const attempts = await getFailedLoginOtpAttempts(email);
  Logger.warn("Login OTP verification locked", { email, attempts });

  throw new BadRequestError(
    i18next.t("login:errors.otpLocked", {
      minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
      lng: language
    })
  );
};

const ensureAuthExists = async (
  email: string,
  t: TFunction
): Promise<AuthDocument> => {
  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("OTP verification failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidOtp"));
  }

  return auth;
};

// =============================================================================
// OTP Verification Handlers
// =============================================================================

const handleInvalidOtp = async (
  email: string,
  auth: AuthDocument,
  language: string,
  req: OtpVerifyRequest
): Promise<never> => {
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
};

const completeSuccessfulLogin = async (
  email: string,
  auth: AuthDocument,
  req: OtpVerifyRequest
): Promise<LoginResponse> => {
  await cleanupLoginOtpData(email);

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

  return generateLoginTokens(auth);
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

  const auth = await ensureAuthExists(email, t);

  const isValid = await verifyLoginOtp(email, otp);

  if (!isValid) {
    await handleInvalidOtp(email, auth, language, req);
  }

  const loginResponse = await completeSuccessfulLogin(email, auth, req);

  return {
    message: t("login:success.loginSuccessful"),
    data: loginResponse
  };
};
