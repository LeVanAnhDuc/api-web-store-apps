// others
import { SECONDS_PER_MINUTE } from "@/constants/time";

export const getSecondsUntilMidnightUTC = (): number => {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
};

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
