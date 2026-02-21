import type { Request } from "express";
import { GEO_DEFAULTS } from "@/constants/enums";
import { HTTP_HEADERS } from "@/constants/infrastructure";
const COMMA_SEPARATOR = ",";
const FIRST_IP_INDEX = 0;

export const extractIp = (req: Request): string => {
  const xForwardedFor = req.headers[HTTP_HEADERS.X_FORWARDED_FOR];

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
