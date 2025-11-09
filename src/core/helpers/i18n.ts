// locales
import {
  MESSAGES,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale
} from "@/shared/locales";

const TEMPLATE_PARAM_REGEX = /\{\{(\w+)\}\}/g;

const getNestedValue = (
  obj: Record<string, unknown>,
  path: string
): unknown => {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      key in current
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
};

const interpolateParams = (
  message: string,
  params: Record<string, string | number>
): string =>
  message.replace(TEMPLATE_PARAM_REGEX, (match, key) =>
    key in params ? String(params[key]) : match
  );

export const getMessage = (
  path: string,
  locale: Locale = DEFAULT_LOCALE,
  params?: Record<string, string | number>
): string => {
  const localeMessages = MESSAGES[locale] as Record<string, unknown>;
  const message = getNestedValue(localeMessages, path);

  if (typeof message !== "string") {
    return path;
  }

  if (!params) {
    return message;
  }

  return interpolateParams(message, params);
};

const isSupportedLocale = (locale: string): locale is Locale =>
  locale === LOCALES.VI || locale === LOCALES.EN;

export const getLocaleFromHeader = (acceptLanguage?: string): Locale => {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const primaryLocale = acceptLanguage
    .split(",")[0]
    .split("-")[0]
    .toLowerCase();

  if (isSupportedLocale(primaryLocale)) {
    return primaryLocale;
  }

  return DEFAULT_LOCALE;
};
