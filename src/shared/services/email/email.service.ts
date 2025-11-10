// libs
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import fs from "fs/promises";
import path from "path";
// types
import type { Locale } from "@/shared/locales";
// utils
import { Logger } from "@/core/utils/logger";
import { getEmailTranslations } from "@/shared/templates/locales";
// configs
import config from "@/core/configs/env";
// constants
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
  locale: Locale = "en"
): Promise<string> => {
  try {
    const templatePath = path.join(
      EMAIL_PATHS.TEMPLATES_DIR,
      `${templateName}.html`
    );
    let template = await fs.readFile(templatePath, "utf-8");

    const translations = getEmailTranslations(locale, templateName);

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
    throw new Error(`Email template rendering failed: ${templateName}`);
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
    throw new Error("Email sending failed");
  }
};

export const sendTemplatedEmail = async (
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string | number>,
  locale: Locale = "en"
): Promise<void> => {
  const htmlContent = await renderEmailTemplate(
    templateName,
    variables,
    locale
  );
  await sendEmail(to, subject, htmlContent);
};
