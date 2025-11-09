// locales
import { EMAIL_TRANSLATIONS_VI } from "./vi";
import { EMAIL_TRANSLATIONS_EN } from "./en";
// types
import type { Locale } from "@/shared/locales";

export const EMAIL_TRANSLATIONS = {
  vi: EMAIL_TRANSLATIONS_VI,
  en: EMAIL_TRANSLATIONS_EN
} as const;

export const getEmailTranslations = (locale: Locale, templateName: string) => {
  const translations = EMAIL_TRANSLATIONS[locale].OTP_VERIFICATION;
  const templateKey = templateName
    .toUpperCase()
    .replace(/-/g, "_") as keyof typeof translations;

  return translations[templateKey] || {};
};
