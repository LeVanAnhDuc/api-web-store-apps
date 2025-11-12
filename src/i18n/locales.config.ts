// Single source of truth for supported locales
// When adding new locale: just add to this array and create corresponding JSON files
// All type definitions and runtime checks will automatically pick up the new locale

export const SUPPORTED_LOCALES = ["vi", "en"] as const;

export const DEFAULT_LOCALE = "vi" as const;
