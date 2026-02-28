import { Logger } from "@/utils/logger";
import { sendModuleEmail } from "@/utils/email/sender";
import { LOGIN_OTP_CONFIG, MAGIC_LINK_CONFIG } from "@/constants/config";
import ENV from "@/configurations/env";

export const sendLoginOtpEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  sendModuleEmail("login", email, locale, {
    templateName: "login-otp",
    subject: "Login Verification Code",
    variables: {
      otp,
      expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Login OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};

export const sendMagicLinkEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const magicLinkUrl = `${ENV.CLIENT_URL}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  sendModuleEmail("login", email, locale, {
    templateName: "magic-link",
    subject: "Magic Link Login",
    variables: {
      magicLinkUrl,
      expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Magic link email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
