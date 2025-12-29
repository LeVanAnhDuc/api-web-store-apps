/**
 * Login OTP Notifier
 * Handles OTP email notification for login
 * Fire-and-forget with proper logging
 */

// libs
import i18next from "@/i18n";
// services
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";

/**
 * Send login OTP email asynchronously
 * This is a fire-and-forget operation with logging
 *
 * @param email - Recipient email
 * @param otp - OTP code (plain text, for email only)
 * @param locale - User's locale for i18n
 */
export const notifyLoginOtpByEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.loginOtp");

  sendTemplatedEmail(
    email,
    subject,
    "login-otp",
    {
      otp,
      expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
    },
    locale
  )
    .then(() => {
      Logger.info("Login OTP email sent successfully", { email });
      return;
    })
    .catch((error) => {
      Logger.error("Login OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
