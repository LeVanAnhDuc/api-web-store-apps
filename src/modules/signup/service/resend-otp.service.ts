/**
 * Resend OTP Service
 * Use Case: User requests new OTP (already in signup flow)
 *
 * Business Flow:
 * 1. Ensure cooldown period has expired
 * 2. Ensure resend limit not exceeded
 * 3. Ensure email is not already registered
 * 4. Generate and store new OTP (hashed)
 * 5. Start cooldown period
 * 6. Increment resend counter
 * 7. Send OTP email (async, fire-and-forget)
 *
 * Difference from sendOtp: Tracks resend count and enforces limit
 */

// types
import type { TFunction } from "i18next";
import type {
  ResendOtpRequest,
  ResendOtpResponse
} from "@/shared/types/modules/signup";

// errors
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";

// repository
import { isEmailRegistered } from "@/modules/signup/repository";

// store (Redis operations)
import {
  checkOtpCoolDown,
  setOtpCoolDown,
  createAndStoreOtp,
  deleteOtp,
  hasExceededResendLimit,
  incrementResendCount
} from "@/modules/signup/utils/store";

// notifier
import { notifyOtpByEmail } from "@/modules/signup/notifier";

// utils
import { generateOtp } from "@/modules/signup/utils/otp";

// constants
import { OTP_CONFIG } from "@/shared/constants/modules/signup";
import { SECONDS_PER_MINUTE, MINUTES_PER_HOUR } from "@/shared/constants/time";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

/**
 * Ensure cooldown period has expired before resending OTP
 * @throws BadRequestError if cooldown is active
 */
const ensureCooldownExpired = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCoolDown(email);

  if (!canSend) {
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }
};

/**
 * Ensure user has not exceeded maximum resend attempts
 * @throws BadRequestError if limit exceeded
 */
const ensureResendLimitNotExceeded = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exceeded = await hasExceededResendLimit(
    email,
    OTP_CONFIG.MAX_RESEND_COUNT
  );

  if (exceeded) {
    throw new BadRequestError(t("signup:errors.resendLimitExceeded"));
  }
};

/**
 * Ensure email is not already registered
 * @throws ConflictRequestError if email exists
 */
const ensureEmailNotRegistered = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

// =============================================================================
// Business Operations
// =============================================================================

/**
 * Create and store new OTP for email
 * Deletes any existing OTP first (idempotency)
 */
const createNewOtp = async (email: string): Promise<string> => {
  const otp = generateOtp();
  const expirySeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  // Delete existing OTP first (idempotency)
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, expirySeconds);

  return otp;
};

/**
 * Start cooldown period for next resend
 */
const startCooldown = async (email: string): Promise<void> => {
  await setOtpCoolDown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
};

/**
 * Track resend attempt
 * @returns Current resend count after increment
 */
const trackResendAttempt = async (email: string): Promise<number> => {
  // Window: 1 hour for resend count tracking
  const windowSeconds = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
  return incrementResendCount(email, windowSeconds);
};

// =============================================================================
// Main Service
// =============================================================================

/**
 * Resend OTP to user email
 * Differs from sendOtp by tracking resend attempts
 *
 * @param req - Express request with ResendOtpBody
 * @returns ResendOtpResponse with resend count info
 *
 * @throws BadRequestError - Cooldown active or resend limit exceeded
 * @throws ConflictRequestError - Email already registered
 */
export const resendOtp = async (
  req: ResendOtpRequest
): Promise<Partial<ResponsePattern<ResendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  // Step 1: Business rule validations
  await ensureCooldownExpired(email, t);
  await ensureResendLimitNotExceeded(email, t);
  await ensureEmailNotRegistered(email, t);

  // Step 2: Generate and store OTP
  const otp = await createNewOtp(email);

  // Step 3: Start cooldown for next resend
  await startCooldown(email);

  // Step 4: Track resend attempt
  const currentResendCount = await trackResendAttempt(email);

  // Step 5: Send email notification (async, controlled side effect)
  notifyOtpByEmail(email, otp, language as I18n.Locale);

  // Step 6: Build response
  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: t("signup:success.otpResent"),
    data: {
      success: true,
      expiresIn: expiresInSeconds,
      cooldownSeconds: OTP_CONFIG.RESEND_COOLDOWN_SECONDS,
      resendCount: currentResendCount,
      maxResends: OTP_CONFIG.MAX_RESEND_COUNT
    }
  };
};
