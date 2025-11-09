import VI_LOCALE from "./vi";
import EN_LOCALE from "./en";

export const LOCALES = {
  VI: "vi",
  EN: "en"
} as const;

export type Locale = (typeof LOCALES)[keyof typeof LOCALES];

export const MESSAGES = {
  [LOCALES.VI]: VI_LOCALE,
  [LOCALES.EN]: EN_LOCALE
} as const;

export const DEFAULT_LOCALE: Locale = LOCALES.VI;

export { VI_LOCALE, EN_LOCALE };
