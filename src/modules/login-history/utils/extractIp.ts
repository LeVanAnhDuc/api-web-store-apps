import type { Request } from "express";
import { GEO_DEFAULTS } from "@/modules/login-history/constants";

const X_FORWARDED_FOR_HEADER = "x-forwarded-for";
const COMMA_SEPARATOR = ",";
const FIRST_IP_INDEX = 0;

export const extractIp = (req: Request): string => {
  const xForwardedFor = req.headers[X_FORWARDED_FOR_HEADER];

  if (xForwardedFor) {
    if (typeof xForwardedFor === "string") {
      return xForwardedFor.split(COMMA_SEPARATOR)[FIRST_IP_INDEX].trim();
    }

    if (Array.isArray(xForwardedFor)) {
      return xForwardedFor[FIRST_IP_INDEX].trim();
    }
  }

  if (req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return GEO_DEFAULTS.UNKNOWN_IP;
};
