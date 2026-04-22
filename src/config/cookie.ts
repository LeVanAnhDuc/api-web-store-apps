// types
import type { CookieOptions } from "express";
// config
import ENV from "@/config/env";
// others
import { TOKEN_EXPIRY } from "@/modules/token/constants";

const allowCrossOrigin = ENV.ALLOW_CROSS_ORIGIN_COOKIES === "true";

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: allowCrossOrigin || ENV.NODE_ENV === "production",
  sameSite: allowCrossOrigin ? "none" : "lax",
  maxAge: TOKEN_EXPIRY.NUMBER_REFRESH_TOKEN,
  path: "/"
} as const;
