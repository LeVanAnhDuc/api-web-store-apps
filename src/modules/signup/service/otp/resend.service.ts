import type {
  ResendOtpRequest,
  ResendOtpResponse
} from "@/modules/signup/types";
import { Logger } from "@/infra/utils/logger";
import { otpStore } from "@/modules/signup/store";
import { OTP_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE, MINUTES_PER_HOUR } from "@/app/constants/time";
import {
  createAndStoreOtp,
  setOtpCooldown,
  sendSignupOtpEmail
} from "../shared";
import {
  ensureEmailAvailable,
  ensureCooldownExpired,
  ensureCanResend
} from "../validators";

const CONFIG = {
  OTP_EXPIRY_SECONDS: OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE,
  COOLDOWN_SECONDS: OTP_CONFIG.RESEND_COOLDOWN_SECONDS,
  RESEND_WINDOW_SECONDS: MINUTES_PER_HOUR * SECONDS_PER_MINUTE,
  MAX_RESEND_COUNT: OTP_CONFIG.MAX_RESEND_COUNT
};

const trackResendAttempt = async (email: string): Promise<number> => {
  const count = await otpStore.incrementResendCount(
    email,
    CONFIG.RESEND_WINDOW_SECONDS
  );

  Logger.debug("Resend attempt tracked", {
    email,
    currentCount: count,
    maxResends: CONFIG.MAX_RESEND_COUNT,
    windowSeconds: CONFIG.RESEND_WINDOW_SECONDS
  });

  return count;
};

export const resendOtpService = async (
  req: ResendOtpRequest
): Promise<Partial<ResponsePattern<ResendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("ResendOtp initiated", { email });

  await ensureCooldownExpired(email, language);
  await ensureCanResend(email, CONFIG.MAX_RESEND_COUNT, t);
  await ensureEmailAvailable(email, t);

  const otp = await createAndStoreOtp(email, CONFIG.OTP_EXPIRY_SECONDS);

  await setOtpCooldown(email, CONFIG.COOLDOWN_SECONDS);

  const currentResendCount = await trackResendAttempt(email);

  sendSignupOtpEmail(email, otp, language as I18n.Locale);

  Logger.info("ResendOtp completed", {
    email,
    resendCount: currentResendCount,
    maxResends: CONFIG.MAX_RESEND_COUNT,
    expiresIn: CONFIG.OTP_EXPIRY_SECONDS
  });

  return {
    message: t("signup:success.otpResent"),
    data: {
      success: true,
      expiresIn: CONFIG.OTP_EXPIRY_SECONDS,
      cooldownSeconds: CONFIG.COOLDOWN_SECONDS,
      resendCount: currentResendCount,
      maxResends: CONFIG.MAX_RESEND_COUNT,
      remainingResends: CONFIG.MAX_RESEND_COUNT - currentResendCount
    }
  };
};
