import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import Logger from "@/utils/logger";
import geoip from "geoip-lite";
import {
  CLIENT_TYPES,
  DEVICE_TYPES,
  GEO_DEFAULTS,
  USER_AGENT_DEFAULTS
} from "@/constants/enums";
import { HTTP_HEADERS } from "@/constants/infrastructure";
import type { ClientType, DeviceType } from "@/types/modules/login-history";

// ──────────────────────────────────────────────
// extractIp
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// parseUserAgent
// ──────────────────────────────────────────────

const MOBILE_DEVICE_TYPE = "mobile";
const TABLET_DEVICE_TYPE = "tablet";

const mapDeviceType = (deviceType?: string): DeviceType => {
  if (!deviceType) {
    return DEVICE_TYPES.DESKTOP;
  }

  const type = deviceType.toLowerCase();

  if (type === MOBILE_DEVICE_TYPE) return DEVICE_TYPES.MOBILE;
  if (type === TABLET_DEVICE_TYPE) return DEVICE_TYPES.TABLET;

  return DEVICE_TYPES.DESKTOP;
};

export const parseUserAgent = (
  userAgent: string
): {
  deviceType: DeviceType;
  os: string;
  browser: string;
} => {
  try {
    if (!userAgent || userAgent.trim().length === 0) {
      return {
        deviceType: DEVICE_TYPES.UNKNOWN,
        os: USER_AGENT_DEFAULTS.UNKNOWN_OS,
        browser: USER_AGENT_DEFAULTS.UNKNOWN_BROWSER
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceType = mapDeviceType(result.device.type);
    const os = result.os.name || USER_AGENT_DEFAULTS.UNKNOWN_OS;
    const browser = result.browser.name || USER_AGENT_DEFAULTS.UNKNOWN_BROWSER;

    const osVersion = result.os.version ? ` ${result.os.version}` : "";
    const browserVersion = result.browser.version
      ? ` ${result.browser.version}`
      : "";

    return {
      deviceType,
      os: `${os}${osVersion}`,
      browser: `${browser}${browserVersion}`
    };
  } catch (error) {
    return {
      deviceType: DEVICE_TYPES.UNKNOWN,
      os: USER_AGENT_DEFAULTS.UNKNOWN_OS,
      browser: USER_AGENT_DEFAULTS.UNKNOWN_BROWSER
    };
  }
};

// ──────────────────────────────────────────────
// geoipLookup
// ──────────────────────────────────────────────

const LOCALHOST_VALUES = ["localhost", "0.0.0.0"] as const;

const PRIVATE_IP_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 loopback
  /^fe80:/, // IPv6 link-local
  /^fc00:/, // IPv6 private
  /^fd00:/ // IPv6 private
] as const;

export const geoipLookup = (
  ip: string
): {
  country: string;
  city: string;
} => {
  try {
    if (!ip || ip.trim().length === 0) {
      return {
        country: GEO_DEFAULTS.UNKNOWN_COUNTRY,
        city: GEO_DEFAULTS.UNKNOWN_CITY
      };
    }

    const isPrivate = PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
    const isLocalhost = LOCALHOST_VALUES.includes(
      ip as (typeof LOCALHOST_VALUES)[number]
    );

    if (isPrivate || isLocalhost) {
      return {
        country: GEO_DEFAULTS.UNKNOWN_COUNTRY,
        city: GEO_DEFAULTS.UNKNOWN_CITY
      };
    }

    const geo = geoip.lookup(ip);

    if (!geo) {
      Logger.debug("GeoIP lookup returned no result", { ip });
      return {
        country: GEO_DEFAULTS.UNKNOWN_COUNTRY,
        city: GEO_DEFAULTS.UNKNOWN_CITY
      };
    }

    return {
      country: geo.country || GEO_DEFAULTS.UNKNOWN_COUNTRY,
      city: geo.city || GEO_DEFAULTS.UNKNOWN_CITY
    };
  } catch (error) {
    Logger.warn("GeoIP lookup failed", { ip, error });
    return {
      country: GEO_DEFAULTS.UNKNOWN_COUNTRY,
      city: GEO_DEFAULTS.UNKNOWN_CITY
    };
  }
};

// ──────────────────────────────────────────────
// determineClientType
// ──────────────────────────────────────────────

export const determineClientType = (clientTypeHeader?: string): ClientType => {
  if (!clientTypeHeader) {
    return CLIENT_TYPES.WEB;
  }

  const type = clientTypeHeader.toLowerCase();

  if (type === "mobile_ios" || type === "ios") return CLIENT_TYPES.MOBILE_IOS;
  if (type === "mobile_android" || type === "android")
    return CLIENT_TYPES.MOBILE_ANDROID;

  return CLIENT_TYPES.WEB;
};
