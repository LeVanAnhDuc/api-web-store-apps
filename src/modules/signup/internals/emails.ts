import { Logger } from "@/utils/logger";
import { sendModuleEmail } from "@/utils/email/sender";
import { OTP_CONFIG } from "@/constants/config";

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
