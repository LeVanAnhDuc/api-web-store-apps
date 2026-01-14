import i18next from "@/i18n";
import { NodemailerTransport } from "@/app/services/implements/NodemailerTransport";
import { renderEmailTemplate } from "@/app/utils/email";
import { Logger } from "@/infra/utils/logger";
import { ACCOUNT_UNLOCK_CONFIG } from "@/modules/login/constants";

export const sendUnlockEmail = async (
  email: string,
  unlockUrl: string,
  locale: I18n.Locale
): Promise<void> => {
  try {
    const t = i18next.getFixedT(locale);
    const subject = t("email:subjects.accountUnlock");

    const htmlContent = await renderEmailTemplate(
      "account-unlock",
      {
        unlockUrl,
        expiryHours: ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_EXPIRY_HOURS
      },
      locale
    );

    const emailService = NodemailerTransport.getInstance();
    await emailService.sendRawEmail({
      to: email,
      subject,
      htmlContent
    });

    Logger.info("Account unlock email sent successfully", { email });
  } catch (error) {
    Logger.error("Failed to send unlock email", {
      email,
      template: "account-unlock",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
