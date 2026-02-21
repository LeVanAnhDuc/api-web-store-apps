import type { CookieOptions } from "express";
import { TOKEN_EXPIRY } from "@/constants/infrastructure";
import ENV from "@/configurations/env";

const allowCrossOrigin = ENV.ALLOW_CROSS_ORIGIN_COOKIES === "true";

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: allowCrossOrigin || ENV.NODE_ENV === "production",
  sameSite: allowCrossOrigin ? "none" : "lax",
  maxAge: TOKEN_EXPIRY.NUMBER_REFRESH_TOKEN,
  path: "/"
} as const;
