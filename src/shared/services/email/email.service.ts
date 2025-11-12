import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import fs from "fs/promises";
import path from "path";

import i18next from "@/i18n";
import { Logger } from "@/core/utils/logger";
import config from "@/core/configs/env";
import {
  EMAIL_SERVICE,
  EMAIL_POOL,
  EMAIL_RATE_LIMIT,
  EMAIL_PATHS
} from "@/shared/constants/email";

const transporter: Transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE.PROVIDER,
  auth: {
    user: config.USERNAME_EMAIL,
    pass: config.PASSWORD_EMAIL
  },
  pool: true,
  maxConnections: EMAIL_POOL.MAX_CONNECTIONS,
  maxMessages: EMAIL_POOL.MAX_MESSAGES_PER_CONNECTION,
  rateDelta: EMAIL_RATE_LIMIT.DELTA_MS,
  rateLimit: EMAIL_RATE_LIMIT.PER_SECOND
});

const renderEmailTemplate = async (
  templateName: string,
  variables: Record<string, string | number>,
  locale: I18n.Locale = "en"
): Promise<string> => {
  try {
    const templatePath = path.join(
      EMAIL_PATHS.TEMPLATES_DIR,
      `${templateName}.html`
    );
    let template = await fs.readFile(templatePath, "utf-8");

    // Using i18next with fixed language for email translations
    const t = i18next.getFixedT(locale);

    // Getting all translations for the template from i18next
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

    const allVariables = {
      ...translations,
      ...variables
    };

    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      template = template.replaceAll(placeholder, String(value));
    });

    return template;
  } catch (error) {
    Logger.error(`Failed to render email template: ${templateName}`, error);
    const errorMessage = i18next.t("common:errors.emailTemplateFailed", {
      templateName
    });
    throw new Error(errorMessage);
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: config.USERNAME_EMAIL,
      to,
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    Logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    Logger.error(`Failed to send email to ${to}`, error);
    const errorMessage = i18next.t("common:errors.emailSendFailed");
    throw new Error(errorMessage);
  }
};

export const sendTemplatedEmail = async (
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string | number>,
  locale: I18n.Locale = "en"
): Promise<void> => {
  const htmlContent = await renderEmailTemplate(
    templateName,
    variables,
    locale
  );
  await sendEmail(to, subject, htmlContent);
};
