import i18next from "@/i18n";
import { BadRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";

export const ensureCooldownExpired = async <
  T extends {
    checkCooldown: (email: string) => Promise<boolean>;
    getCooldownRemaining: (email: string) => Promise<number>;
  }
>(
  store: T,
  email: string,
  language: string,
  logMessage: string,
  errorKey: "login:errors.otpCooldown" | "login:errors.magicLinkCooldown"
): Promise<void> => {
  const canSend = await store.checkCooldown(email);

  if (!canSend) {
    const remaining = await store.getCooldownRemaining(email);
    Logger.warn(logMessage, { email, remaining });
    throw new BadRequestError(
      i18next.t(errorKey, {
        seconds: remaining,
        lng: language
      })
    );
  }
};

export const getClientIp = (req: {
  headers: Record<string, unknown>;
  ip?: string;
}): string => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp.trim();
  }

  return req.ip || "unknown";
};
