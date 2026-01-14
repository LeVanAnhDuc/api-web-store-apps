import fs from "fs/promises";
import path from "path";
import { Logger } from "@/core/utils/logger";
import { EMAIL_PATHS } from "@/shared/constants/email";

export const renderEmailTemplate = async (
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

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      template = template.replaceAll(placeholder, String(value));
    });

    return template;
  } catch (error) {
    Logger.error("Failed to render email template", {
      templateName,
      locale,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
