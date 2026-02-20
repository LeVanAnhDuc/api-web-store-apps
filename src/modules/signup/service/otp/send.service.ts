import type { SendOtpRequest, SendOtpResponse } from "@/modules/signup/types";
import { Logger } from "@/infra/utils/logger";
import { OTP_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE } from "@/constants/time";
import {
  createAndStoreOtp,
  setOtpCooldown,
  sendSignupOtpEmail
} from "../shared";
import { ensureEmailAvailable, ensureCooldownExpired } from "../validators";

const CONFIG = {
  OTP_EXPIRY_SECONDS: OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE,
  COOLDOWN_SECONDS: OTP_CONFIG.RESEND_COOLDOWN_SECONDS
};

export const sendOtpService = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("SendOtp initiated", { email });

  await ensureCooldownExpired(email, t);
  await ensureEmailAvailable(email, t);

  const otp = await createAndStoreOtp(email, CONFIG.OTP_EXPIRY_SECONDS);

  await setOtpCooldown(email, CONFIG.COOLDOWN_SECONDS);

  sendSignupOtpEmail(email, otp, language as I18n.Locale);

  Logger.info("SendOtp completed", {
    email,
    expiresIn: CONFIG.OTP_EXPIRY_SECONDS,
    cooldownSeconds: CONFIG.COOLDOWN_SECONDS
  });

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: CONFIG.OTP_EXPIRY_SECONDS,
      cooldownSeconds: CONFIG.COOLDOWN_SECONDS
    }
  };
};
