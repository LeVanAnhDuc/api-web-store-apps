import i18next from "@/i18n";
import { NodemailerTransport } from "@/shared/services/implements/NodemailerTransport";
import { renderEmailTemplate } from "@/shared/utils/email";
import { Logger } from "@/core/utils/logger";
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";

export const sendLoginOtpEmail = async (
  email: string,
  otp: string,
  locale: I18n.Locale
): Promise<void> => {
  try {
    const t = i18next.getFixedT(locale);
    const subject = t("email:subjects.loginOtp");

    const htmlContent = await renderEmailTemplate(
      "login-otp",
      {
        otp,
        expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
      },
      locale
    );

    const emailService = NodemailerTransport.getInstance();
    await emailService.sendRawEmail({
      to: email,
      subject,
      htmlContent
    });

    Logger.info("Login OTP email sent successfully", { email });
  } catch (error) {
    Logger.error("Failed to send login OTP email", {
      email,
      template: "login-otp",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
