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

// libs
import i18next from "@/i18n";

// types
import type { TFunction } from "i18next";
import type {
  VerifyOtpRequest,
  VerifyOtpResponse
} from "@/shared/types/modules/signup";

// errors
import { BadRequestError } from "@/core/responses/error";

// store (Redis operations)
import {
  verifyOtp as verifyOtpFromStore,
  isOtpAccountLocked,
  incrementFailedOtpAttempts,
  storeSession,
  cleanupOtpData
} from "@/modules/signup/utils/store";

// utils
import { generateSessionId } from "@/modules/signup/utils/otp";

// constants
import { OTP_CONFIG, SESSION_CONFIG } from "@/shared/constants/modules/signup";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

/**
 * Ensure account is not locked due to too many failed attempts
 * @throws BadRequestError if account is locked
 */
const ensureAccountNotLocked = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const isLocked = await isOtpAccountLocked(
    email,
    OTP_CONFIG.MAX_FAILED_ATTEMPTS
  );

  if (isLocked) {
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }
};

/**
 * Verify OTP matches stored hash
 * Handles failed attempts tracking and remaining attempts message
 *
 * @throws BadRequestError if OTP is invalid
 */
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
      OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    );
    const remainingAttempts = OTP_CONFIG.MAX_FAILED_ATTEMPTS - failedCount;

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

// =============================================================================
// Business Operations
// =============================================================================

/**
 * Create signup session for verified email
 * Session allows user to proceed to complete signup step
 */
const createSignupSession = async (email: string): Promise<string> => {
  const sessionToken = generateSessionId();
  const expirySeconds = SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  await storeSession(email, sessionToken, expirySeconds);

  return sessionToken;
};

// =============================================================================
// Main Service
// =============================================================================

/**
 * Verify OTP code submitted by user
 *
 * @param req - Express request with VerifyOtpBody
 * @returns VerifyOtpResponse with session token for next step
 *
 * @throws BadRequestError - Account locked or invalid OTP
 */
export const verifyOtp = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  // Step 1: Check lockout status
  await ensureAccountNotLocked(email, t);

  // Step 2: Verify OTP (handles failed attempts internally)
  await verifyOtpMatch(email, otp, t, language);

  // Step 3: Create session for next step
  const sessionToken = await createSignupSession(email);

  // Step 4: Cleanup OTP data (success path)
  await cleanupOtpData(email);

  // Step 5: Build response
  const expiresInSeconds = SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionToken,
      expiresIn: expiresInSeconds
    }
  };
};
