import fs from "fs/promises";
import { Logger } from "@/infra/utils/logger";

export const renderEmailTemplate = async (
  templateName: string,
  variables: Record<string, string | number>,
  locale: I18n.Locale = "en",
  templatePath: string
): Promise<string> => {
  try {
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
      templatePath,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};
