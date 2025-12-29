/**
 * Magic Link Notifier
 * Handles magic link email notification for passwordless login
 * Fire-and-forget with proper logging
 */

// libs
import i18next from "@/i18n";
// services
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import { MAGIC_LINK_CONFIG } from "@/shared/constants/modules/session";
import ENV from "@/core/configs/env";

/**
 * Send magic link email asynchronously
 * This is a fire-and-forget operation with logging
 *
 * @param email - Recipient email
 * @param token - Magic link token (plain text, for email URL)
 * @param locale - User's locale for i18n
 */
export const notifyMagicLinkByEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.magicLink");

  // Build magic link URL
  const magicLinkUrl = `${ENV.CLIENT_URL}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  sendTemplatedEmail(
    email,
    subject,
    "magic-link",
    {
      magicLinkUrl,
      expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES
    },
    locale
  )
    .then(() => {
      Logger.info("Magic link email sent successfully", { email });
      return;
    })
    .catch((error) => {
      Logger.error("Magic link email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
