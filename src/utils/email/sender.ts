import path from "path";
import { NodemailerTransport } from "@/app/services/implements/NodemailerTransport";
import { renderEmailTemplate } from "./template-helper";
import { Logger } from "@/utils/logger";

interface EmailConfig {
  templateName: string;
  subject: string;
  variables: Record<string, string | number>;
}

export const sendModuleEmail = async (
  moduleName: string,
  email: string,
  locale: I18n.Locale,
  config: EmailConfig
): Promise<void> => {
  const templatePath = path.join(
    process.cwd(),
    __dirname.includes("dist") ? "dist" : "src",
    `modules/${moduleName}/templates/${config.templateName}.html`
  );

  try {
    const htmlContent = await renderEmailTemplate(
      config.templateName,
      config.variables,
      locale,
      templatePath
    );

    const emailService = NodemailerTransport.getInstance();
    await emailService.sendRawEmail({
      to: email,
      subject: config.subject,
      htmlContent
    });

    Logger.info(`${config.templateName} email sent successfully`, { email });
  } catch (error) {
    Logger.error(`Failed to send ${config.templateName} email`, {
      email,
      template: config.templateName,
      templatePath,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
