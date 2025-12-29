/**
 * Account Unlock Notifier
 * Handles unlock link email notification for locked accounts
 * Fire-and-forget with proper logging
 */

// libs
import i18next from "@/i18n";
// services
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import { ACCOUNT_UNLOCK_CONFIG } from "@/shared/constants/modules/session";
import ENV from "@/core/configs/env";

/**
 * Send account unlock email asynchronously
 * This is a fire-and-forget operation with logging
 *
 * @param email - Recipient email
 * @param token - Unlock token (plain text, for email URL)
 * @param locale - User's locale for i18n
 */
export const notifyUnlockLinkByEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.accountUnlock");

  // Build unlock URL
  const unlockUrl = `${ENV.CLIENT_URL}/auth/unlock?token=${token}&email=${encodeURIComponent(email)}`;

  sendTemplatedEmail(
    email,
    subject,
    "account-unlock",
    {
      unlockUrl,
      expiryHours: ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_EXPIRY_HOURS
    },
    locale
  )
    .then(() => {
      Logger.info("Account unlock email sent successfully", { email });
      return;
    })
    .catch((error) => {
      Logger.error("Account unlock email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
