/**
 * OTP Notifier
 * Handles OTP email notification as controlled side effect
 * Fire-and-forget with proper logging for observability
 */

// libs
import i18next from "@/i18n";

// services
import { sendTemplatedEmail } from "@/shared/services/email/email.service";

// utils
import { Logger } from "@/core/utils/logger";

// constants
import { OTP_CONFIG } from "@/shared/constants/modules/signup";

/**
 * Send OTP verification email asynchronously
 * This is a fire-and-forget operation with logging
 * Email delivery failure does NOT fail the signup flow
 *
 * @param email - Recipient email
 * @param otp - OTP code (plain text, for email only)
 * @param locale - User's locale for i18n
 */
export const notifyOtpByEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.otpVerification");

  sendTemplatedEmail(
    email,
    subject,
    "otp-verification",
    {
      otp,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    },
    locale
  )
    .then(() => {
      Logger.info("OTP email sent successfully", { email });
      return;
    })
    .catch((error) => {
      Logger.error("OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
