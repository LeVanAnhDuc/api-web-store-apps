import { Logger } from "@/infra/utils/logger";
import { otpStore } from "@/modules/signup/store";
import { sendModuleEmail } from "@/utils/email/sender";
import { OTP_CONFIG } from "@/modules/signup/constants";

export const createAndStoreOtp = async (
  email: string,
  expirySeconds: number
): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, expirySeconds);

  Logger.debug("OTP created and stored", {
    email,
    expiresInSeconds: expirySeconds
  });

  return otp;
};

export const setOtpCooldown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  await otpStore.setCooldown(email, cooldownSeconds);

  Logger.debug("OTP cooldown set", {
    email,
    cooldownSeconds
  });
};

export const sendSignupOtpEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  sendModuleEmail("signup", email, locale, {
    templateName: "signup-otp",
    subject: "Signup Verification Code",
    variables: {
      otp,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Signup OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
