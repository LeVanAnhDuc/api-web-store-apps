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

// logger
import { Logger } from "@/core/utils/logger";

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

const TIME_OTP_EXPIRES = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_OTP_RESEND = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;

const ensureCooldownExpired = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCoolDown(email);

  if (!canSend) {
    Logger.warn("OTP cooldown not expired", { email });
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }
};

const ensureEmailNotRegistered = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Signup attempt with existing email", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

// =============================================================================
// Business Operations
// =============================================================================

const createNewOtp = async (email: string): Promise<string> => {
  const otp = generateOtp();

  // Delete existing OTP first (idempotency - same request can be retried)
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, TIME_OTP_EXPIRES);

  Logger.debug("OTP created and stored in Redis", {
    email,
    expiresInSeconds: TIME_OTP_EXPIRES
  });

  return otp;
};

const startCooldown = async (email: string): Promise<void> => {
  await setOtpCoolDown(email, TIME_OTP_RESEND);

  Logger.debug("OTP cooldown started", {
    email,
    cooldownSeconds: TIME_OTP_RESEND
  });
};

// =============================================================================
// Main Service
// =============================================================================

export const sendOtp = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("SendOtp initiated", { email });

  await ensureCooldownExpired(email, t);
  await ensureEmailNotRegistered(email, t);

  const otp = await createNewOtp(email);

  await startCooldown(email);

  notifyOtpByEmail(email, otp, language as I18n.Locale);

  Logger.info("SendOtp completed", {
    email,
    expiresIn: TIME_OTP_EXPIRES,
    cooldownSeconds: TIME_OTP_RESEND
  });

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: TIME_OTP_EXPIRES,
      cooldownSeconds: TIME_OTP_RESEND
    }
  };
};
