import type { CookieOptions } from "express";
import { TOKEN_EXPIRY } from "@/constants/infrastructure";

const allowCrossOrigin = process.env.ALLOW_CROSS_ORIGIN_COOKIES === "true";

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: allowCrossOrigin || process.env.NODE_ENV === "production",
  sameSite: allowCrossOrigin ? "none" : "lax",
  maxAge: TOKEN_EXPIRY.NUMBER_REFRESH_TOKEN,
  path: "/"
} as const;
