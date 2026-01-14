/**
 * OTP Notifier
 * Handles OTP email notification as controlled side effect
 * Fire-and-forget with proper logging for observability
 */

import { sendOtpEmail } from "@/modules/signup/email/send-otp-email";
import { Logger } from "@/infra/utils/logger";

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
  sendOtpEmail(email, otp, locale)
    .then(() => undefined)
    .catch((error) => {
      Logger.error("OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
