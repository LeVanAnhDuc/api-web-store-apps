import i18next from "@/i18n";
import { NodemailerTransport } from "@/app/services/implements/NodemailerTransport";
import { renderEmailTemplate } from "@/app/utils/email";
import { Logger } from "@/infra/utils/logger";
import { OTP_CONFIG } from "@/modules/signup/constants";

export const sendOtpEmail = async (
  email: string,
  otp: string,
  locale: I18n.Locale
): Promise<void> => {
  try {
    const t = i18next.getFixedT(locale);
    const subject = t("email:subjects.otpVerification");

    const translations = {
      header_title: t("email:otpVerification.headerTitle"),
      greeting: t("email:otpVerification.greeting"),
      intro_text: t("email:otpVerification.introText"),
      expiry_text: t("email:otpVerification.expiryText"),
      expiry_minutes_label: t("email:otpVerification.expiryMinutesLabel"),
      resend_text: t("email:otpVerification.resendText"),
      warning_text: t("email:otpVerification.warningText"),
      footer_text: t("email:otpVerification.footerText"),
      copyright: t("email:otpVerification.copyright")
    };

    const htmlContent = await renderEmailTemplate(
      "otp-verification",
      {
        ...translations,
        otp,
        expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
      },
      locale
    );

    const emailService = NodemailerTransport.getInstance();
    await emailService.sendRawEmail({
      to: email,
      subject,
      htmlContent
    });

    Logger.info("OTP email sent successfully", { email });
  } catch (error) {
    Logger.error("Failed to send OTP email", {
      email,
      template: "otp-verification",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};

export const sendOtpEmailAsync = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  sendOtpEmail(email, otp, locale)
    .then(() => undefined)
    .catch((error) => {
      Logger.error("OTP email delivery failed (async)", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
