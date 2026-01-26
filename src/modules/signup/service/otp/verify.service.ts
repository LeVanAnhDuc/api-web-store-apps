/**
 * Verify OTP Service
 * Use Case: User submits OTP code for verification
 *
 * Business Flow:
 * 1. Ensure account is not locked (too many failed attempts)
 * 2. Verify OTP matches stored hash
 * 3. Create signup session token on success
 * 4. Cleanup OTP data
 *
 * Security: Implements brute force protection with lockout
 */

import i18next from "@/i18n";

import type { TFunction } from "i18next";
import type {
  VerifyOtpRequest,
  VerifyOtpResponse
} from "@/modules/signup/types";

import { BadRequestError } from "@/infra/responses/error";

import { Logger } from "@/infra/utils/logger";

import {
  verifyOtp as verifyOtpFromStore,
  isOtpAccountLocked,
  incrementFailedOtpAttempts,
  storeSession,
  cleanupOtpData
} from "@/modules/signup/utils/store";

import { generateSessionId } from "@/modules/signup/utils/otp";

import { OTP_CONFIG, SESSION_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";

const TIME_MAX_FAILED_ATTEMPTS = OTP_CONFIG.MAX_FAILED_ATTEMPTS;
const TIME_LOCKOUT_DURATION_MINUTES = OTP_CONFIG.LOCKOUT_DURATION_MINUTES;
const TIME_EXPIRES_SESSION_MINUTES =
  SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const ensureAccountNotLocked = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const isLocked = await isOtpAccountLocked(email, TIME_MAX_FAILED_ATTEMPTS);

  if (isLocked) {
    Logger.warn("OTP account locked due to too many failed attempts", {
      email,
      maxAttempts: TIME_MAX_FAILED_ATTEMPTS
    });
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }
};

const verifyOtpMatch = async (
  email: string,
  otp: string,
  t: TFunction,
  language: string
): Promise<void> => {
  const isValid = await verifyOtpFromStore(email, otp);

  if (!isValid) {
    const failedCount = await incrementFailedOtpAttempts(
      email,
      TIME_LOCKOUT_DURATION_MINUTES
    );
    const remainingAttempts = TIME_MAX_FAILED_ATTEMPTS - failedCount;

    Logger.warn("Invalid OTP attempt", {
      email,
      failedCount,
      remainingAttempts,
      lockoutDurationMinutes: TIME_LOCKOUT_DURATION_MINUTES
    });

    if (remainingAttempts > 0) {
      const errorMessage = i18next.t("signup:errors.invalidOtpWithRemaining", {
        remaining: remainingAttempts,
        lng: language
      });
      throw new BadRequestError(errorMessage);
    }

    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }
};
const createSignupSession = async (email: string): Promise<string> => {
  const sessionToken = generateSessionId();

  await storeSession(email, sessionToken, TIME_EXPIRES_SESSION_MINUTES);

  Logger.debug("Signup session created", {
    email,
    expiresInSeconds: TIME_EXPIRES_SESSION_MINUTES
  });

  return sessionToken;
};
export const verifyOtpService = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  Logger.info("VerifyOtp initiated", { email });

  await ensureAccountNotLocked(email, t);

  await verifyOtpMatch(email, otp, t, language);

  const sessionToken = await createSignupSession(email);

  await cleanupOtpData(email);

  Logger.info("VerifyOtp completed successfully", {
    email,
    sessionExpiresIn: TIME_EXPIRES_SESSION_MINUTES
  });

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionToken,
      expiresIn: TIME_EXPIRES_SESSION_MINUTES
    }
  };
};
