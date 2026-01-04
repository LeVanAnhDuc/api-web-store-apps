import i18next from "@/i18n";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import { Logger } from "@/core/utils/logger";
import { MAGIC_LINK_CONFIG } from "@/shared/constants/modules/session";
import ENV from "@/core/configs/env";

export const notifyMagicLinkByEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.magicLink");

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
