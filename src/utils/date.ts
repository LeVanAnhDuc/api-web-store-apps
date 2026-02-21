import { AGE_VALIDATION } from "@/constants/validation";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";

export const getDateOfBirthBounds = (): {
  minDate: Date;
  maxDate: Date;
} => {
  const now = new Date();

  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() - AGE_VALIDATION.MIN_AGE);

  const minDate = new Date(now);
  minDate.setFullYear(minDate.getFullYear() - AGE_VALIDATION.MAX_AGE);

  return { minDate, maxDate };
};

/**
 * Format duration in seconds to human-readable string
 * Pure function - i18n aware formatting
 *
 * @param seconds - Duration in seconds
 * @param language - Language code (en/vi)
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(45, 'en') // "45 seconds"
 * formatDuration(90, 'en') // "2 minutes"
 * formatDuration(45, 'vi') // "45 giây"
 */
export const formatDuration = (seconds: number, language: string): string => {
  if (seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
    return language === "vi"
      ? `${minutes} phút`
      : `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return language === "vi"
    ? `${seconds} giây`
    : `${seconds} second${seconds > 1 ? "s" : ""}`;
};
