import { Logger } from "@/utils/logger";
import { otpStore, magicLinkStore } from "@/modules/login/store";
import { LOGIN_OTP_CONFIG, MAGIC_LINK_CONFIG } from "@/constants/config";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const OTP_EXPIRY_SECONDS =
  LOGIN_OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
export const OTP_COOLDOWN_SECONDS = LOGIN_OTP_CONFIG.COOLDOWN_SECONDS;
export const MAGIC_LINK_EXPIRY_SECONDS =
  MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
export const MAGIC_LINK_COOLDOWN_SECONDS = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

// ──────────────────────────────────────────────
// OTP helpers
// ──────────────────────────────────────────────

export const createAndStoreOtp = async (email: string): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, OTP_EXPIRY_SECONDS);

  Logger.debug("Login OTP created and stored", {
    email,
    expiresInSeconds: OTP_EXPIRY_SECONDS
  });

  return otp;
};

export const setOtpRateLimits = async (email: string): Promise<void> => {
  await Promise.all([
    otpStore.setCooldown(email, OTP_COOLDOWN_SECONDS),
    otpStore.incrementResendCount(email, OTP_EXPIRY_SECONDS)
  ]);

  Logger.debug("Login OTP rate limits applied", {
    email,
    cooldownSeconds: OTP_COOLDOWN_SECONDS
  });
};

// ──────────────────────────────────────────────
// Magic link helpers
// ──────────────────────────────────────────────

export const createAndStoreToken = async (email: string): Promise<string> => {
  const token = magicLinkStore.createToken();

  await magicLinkStore.clearToken(email);
  await magicLinkStore.storeHashed(email, token, MAGIC_LINK_EXPIRY_SECONDS);

  Logger.debug("Magic link created and stored", {
    email,
    expiresInSeconds: MAGIC_LINK_EXPIRY_SECONDS
  });

  return token;
};

export const setMagicLinkCooldown = async (email: string): Promise<void> => {
  await magicLinkStore.setCooldown(email, MAGIC_LINK_COOLDOWN_SECONDS);

  Logger.debug("Magic link cooldown set", {
    email,
    cooldownSeconds: MAGIC_LINK_COOLDOWN_SECONDS
  });
};

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

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
