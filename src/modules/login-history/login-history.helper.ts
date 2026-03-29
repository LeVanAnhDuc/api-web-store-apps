// libs
import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
// types
import type {
  ClientType,
  DeviceType,
  LoginHistoryAdminQuery
} from "@/types/modules/login-history";
import type { LoginHistoryFilter } from "./repositories/login-history.repository";
// others
import {
  CLIENT_TYPES,
  DEVICE_TYPES,
  GEO_DEFAULTS,
  USER_AGENT_DEFAULTS,
  HTTP_HEADERS,
  LOCALHOST_VALUES,
  PRIVATE_IP_PATTERNS
} from "@/constants/modules/login-history";
import { Logger } from "@/utils/logger";

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
  } catch {
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
// maskIp
// ──────────────────────────────────────────────

const IPV4_PARTS = 4;
const IPV4_KEEP_PARTS = 2;
const IPV6_MIN_PARTS = 4;
const IPV6_KEEP_PARTS = 3;

export const maskIp = (ip: string): string => {
  const ipv4Parts = ip.split(".");
  if (ipv4Parts.length === IPV4_PARTS) {
    return `${ipv4Parts.slice(0, IPV4_KEEP_PARTS).join(".")}.*.*`;
  }

  const ipv6Parts = ip.split(":");
  if (ipv6Parts.length >= IPV6_MIN_PARTS) {
    return `${ipv6Parts.slice(0, IPV6_KEEP_PARTS).join(":")}:*:*:*:*:*`;
  }

  return ip;
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

// ──────────────────────────────────────────────
// buildLoginHistoryFilter
// ──────────────────────────────────────────────

export const buildLoginHistoryFilter = (
  query: LoginHistoryAdminQuery,
  userId?: string
): LoginHistoryFilter => {
  const filter: LoginHistoryFilter = {};

  if (userId) filter.userId = userId;
  else if (query.userId) filter.userId = query.userId;

  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  if (query.deviceType) filter.deviceType = query.deviceType;
  if (query.clientType) filter.clientType = query.clientType;
  if (query.country) filter.country = query.country;
  if (query.city) filter.city = query.city;
  if (query.os) filter.os = query.os;
  if (query.browser) filter.browser = query.browser;
  if (query.ip) filter.ip = query.ip;
  if (query.fromDate) filter.fromDate = new Date(query.fromDate);
  if (query.toDate) filter.toDate = new Date(query.toDate);

  return filter;
};
