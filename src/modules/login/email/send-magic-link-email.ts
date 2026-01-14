import i18next from "@/i18n";
import { NodemailerTransport } from "@/app/services/implements/NodemailerTransport";
import { renderEmailTemplate } from "@/app/utils/email";
import { Logger } from "@/infra/utils/logger";
import { MAGIC_LINK_CONFIG } from "@/modules/login/constants";

export const sendMagicLinkEmail = async (
  email: string,
  magicLinkUrl: string,
  locale: I18n.Locale
): Promise<void> => {
  try {
    const t = i18next.getFixedT(locale);
    const subject = t("email:subjects.magicLink");

    const htmlContent = await renderEmailTemplate(
      "magic-link",
      {
        magicLinkUrl,
        expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES
      },
      locale
    );

    const emailService = NodemailerTransport.getInstance();
    await emailService.sendRawEmail({
      to: email,
      subject,
      htmlContent
    });

    Logger.info("Magic link email sent successfully", { email });
  } catch (error) {
    Logger.error("Failed to send magic link email", {
      email,
      template: "magic-link",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
