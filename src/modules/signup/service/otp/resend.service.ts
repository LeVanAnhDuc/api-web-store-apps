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

import type { TFunction } from "i18next";
import type {
  ResendOtpRequest,
  ResendOtpResponse
} from "@/modules/signup/types";

import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";

import { Logger } from "@/infra/utils/logger";

import { isEmailRegistered } from "@/modules/signup/repository";

import {
  checkOtpCoolDown,
  setOtpCoolDown,
  createAndStoreOtp,
  deleteOtp,
  hasExceededResendLimit,
  incrementResendCount
} from "@/modules/signup/utils/store";

import { sendOtpEmailAsync } from "@/modules/signup/emails/send-otp-email";

import { generateOtp } from "@/modules/signup/utils/otp";

import { OTP_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE, MINUTES_PER_HOUR } from "@/app/constants/time";

const TIME_OTP_EXPIRES = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_OTP_RESEND = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;
const TIME_RESEND_OTP_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const MAX_RESEND_COUNT = OTP_CONFIG.MAX_RESEND_COUNT;
const ensureCooldownExpired = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCoolDown(email);

  if (!canSend) {
    Logger.warn("Resend OTP cooldown not expired", { email });
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }
};

const ensureResendLimitNotExceeded = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exceeded = await hasExceededResendLimit(email, MAX_RESEND_COUNT);

  if (exceeded) {
    Logger.warn("Resend OTP limit exceeded", {
      email,
      maxResends: MAX_RESEND_COUNT
    });
    throw new BadRequestError(t("signup:errors.resendLimitExceeded"));
  }
};

const ensureEmailNotRegistered = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Resend OTP attempt with existing email", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};
const createNewOtp = async (email: string): Promise<string> => {
  const otp = generateOtp();

  // Delete existing OTP first (idempotency)
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, TIME_OTP_EXPIRES);

  Logger.debug("New OTP created for resend", {
    email,
    expiresInSeconds: TIME_OTP_EXPIRES
  });

  return otp;
};

const startCooldown = async (email: string): Promise<void> => {
  await setOtpCoolDown(email, TIME_OTP_RESEND);

  Logger.debug("Resend cooldown started", {
    email,
    cooldownSeconds: TIME_OTP_RESEND
  });
};

const trackResendAttempt = async (email: string): Promise<number> => {
  // Window: 1 hour for resend count tracking
  const count = await incrementResendCount(email, TIME_RESEND_OTP_PER_HOUR);

  Logger.debug("Resend attempt tracked", {
    email,
    currentCount: count,
    maxResends: MAX_RESEND_COUNT,
    windowSeconds: TIME_RESEND_OTP_PER_HOUR
  });

  return count;
};
export const resendOtpService = async (
  req: ResendOtpRequest
): Promise<Partial<ResponsePattern<ResendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("ResendOtp initiated", { email });

  await ensureCooldownExpired(email, t);
  await ensureResendLimitNotExceeded(email, t);
  await ensureEmailNotRegistered(email, t);

  const otp = await createNewOtp(email);

  await startCooldown(email);

  const currentResendCount = await trackResendAttempt(email);

  sendOtpEmailAsync(email, otp, language as I18n.Locale);

  Logger.info("ResendOtp completed", {
    email,
    resendCount: currentResendCount,
    maxResends: MAX_RESEND_COUNT,
    expiresIn: TIME_OTP_EXPIRES
  });

  return {
    message: t("signup:success.otpResent"),
    data: {
      success: true,
      expiresIn: TIME_OTP_EXPIRES,
      cooldownSeconds: TIME_OTP_RESEND,
      resendCount: currentResendCount,
      maxResends: MAX_RESEND_COUNT,
      remainingResends: MAX_RESEND_COUNT - currentResendCount
    }
  };
};
