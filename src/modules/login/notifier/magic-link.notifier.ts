import { sendMagicLinkEmail } from "@/modules/login/email/send-magic-link-email";
import { Logger } from "@/core/utils/logger";
import ENV from "@/core/configs/env";

export const notifyMagicLinkByEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const magicLinkUrl = `${ENV.CLIENT_URL}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  sendMagicLinkEmail(email, magicLinkUrl, locale)
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Magic link email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
