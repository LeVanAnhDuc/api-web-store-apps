/**
 * Account Unlock Notifier
 * Handles unlock link email notification for locked accounts
 * Fire-and-forget with proper logging
 */

import { sendUnlockEmail } from "@/modules/login/email/send-unlock-email";
import { Logger } from "@/core/utils/logger";
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
  const unlockUrl = `${ENV.CLIENT_URL}/auth/unlock?token=${token}&email=${encodeURIComponent(email)}`;

  sendUnlockEmail(email, unlockUrl, locale)
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Account unlock email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
