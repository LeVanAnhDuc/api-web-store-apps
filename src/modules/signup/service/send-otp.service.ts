/**
 * Send OTP Service
 * Use Case: User requests OTP for email verification (first time)
 *
 * Business Flow:
 * 1. Ensure cooldown period has expired
 * 2. Ensure email is not already registered
 * 3. Generate and store new OTP (hashed)
 * 4. Start cooldown period
 * 5. Send OTP email (async, fire-and-forget)
 *
 * Rate Limiting: Handled by middleware (IP + Email)
 * Validation: Handled by schema layer
 */

// types
import type { TFunction } from "i18next";
import type {
  SendOtpRequest,
  SendOtpResponse
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
  deleteOtp
} from "@/modules/signup/utils/store";

// notifier
import { notifyOtpByEmail } from "@/modules/signup/notifier";

// utils
import { generateOtp } from "@/modules/signup/utils/otp";

// constants
import { OTP_CONFIG } from "@/shared/constants/modules/signup";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

/**
 * Ensure cooldown period has expired before sending new OTP
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

  // Delete existing OTP first (idempotency - same request can be retried)
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, expirySeconds);

  return otp;
};

/**
 * Start cooldown period for resend
 */
const startCooldown = async (email: string): Promise<void> => {
  await setOtpCoolDown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
};

// =============================================================================
// Main Service
// =============================================================================

/**
 * Send OTP to user email for verification
 *
 * @param req - Express request with SendOtpBody
 * @returns SendOtpResponse with success status and timing info
 *
 * @throws BadRequestError - Cooldown period active
 * @throws ConflictRequestError - Email already registered
 */
export const sendOtp = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  // Step 1: Business rule validations
  await ensureCooldownExpired(email, t);
  await ensureEmailNotRegistered(email, t);

  // Step 2: Generate and store OTP
  const otp = await createNewOtp(email);

  // Step 3: Start cooldown for next resend
  await startCooldown(email);

  // Step 4: Send email notification (async, controlled side effect)
  notifyOtpByEmail(email, otp, language as I18n.Locale);

  // Step 5: Build response
  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: expiresInSeconds,
      cooldownSeconds: OTP_CONFIG.RESEND_COOLDOWN_SECONDS
    }
  };
};
