/**
 * Device Detection Utilities
 * Parses user agent to extract device information for session tracking
 */

// types
import type { DeviceInfo, DeviceType } from "@/shared/types/modules/session";
// constants
import {
  DEVICE_TYPES,
  DEVICE_CONFIG
} from "@/shared/constants/modules/session";

/**
 * Parse user agent string to extract device information
 * @param userAgent - HTTP User-Agent header value
 * @returns DeviceInfo object
 */
export const parseUserAgent = (userAgent: string): DeviceInfo => {
  if (!userAgent) {
    return {
      name: DEVICE_CONFIG.DEFAULTS.NAME,
      type: DEVICE_CONFIG.DEFAULTS.TYPE as DeviceType,
      browser: DEVICE_CONFIG.DEFAULTS.BROWSER,
      os: DEVICE_CONFIG.DEFAULTS.OS
    };
  }

  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const deviceType = detectDeviceType(userAgent);
  const name = generateDeviceName(browser.name, os.name, deviceType);

  return {
    name,
    type: deviceType,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version
  };
};

/**
 * Detect browser from user agent
 */
const detectBrowser = (
  userAgent: string
): { name: string; version?: string } => {
  const browsers = [
    { pattern: /Edge\/([\d.]+)/, name: "Edge" },
    { pattern: /Edg\/([\d.]+)/, name: "Edge" },
    { pattern: /OPR\/([\d.]+)/, name: "Opera" },
    { pattern: /Chrome\/([\d.]+)/, name: "Chrome" },
    { pattern: /Safari\/([\d.]+)/, name: "Safari" },
    { pattern: /Firefox\/([\d.]+)/, name: "Firefox" },
    { pattern: /MSIE ([\d.]+)/, name: "Internet Explorer" },
    { pattern: /Trident.*rv:([\d.]+)/, name: "Internet Explorer" }
  ];

  for (const { pattern, name } of browsers) {
    const match = userAgent.match(pattern);
    if (match) {
      return { name, version: match[1] };
    }
  }

  return { name: DEVICE_CONFIG.DEFAULTS.BROWSER };
};

/**
 * Detect operating system from user agent
 */
const detectOS = (userAgent: string): { name: string; version?: string } => {
  const operatingSystems = [
    { pattern: /Windows NT ([\d.]+)/, name: "Windows" },
    { pattern: /Mac OS X ([\d._]+)/, name: "macOS" },
    { pattern: /Linux/, name: "Linux" },
    { pattern: /Android ([\d.]+)/, name: "Android" },
    { pattern: /iPhone OS ([\d_]+)/, name: "iOS" },
    { pattern: /iPad.*OS ([\d_]+)/, name: "iPadOS" },
    { pattern: /CrOS/, name: "Chrome OS" }
  ];

  for (const { pattern, name } of operatingSystems) {
    const match = userAgent.match(pattern);
    if (match) {
      const version = match[1]?.replace(/_/g, ".");
      return { name, version };
    }
  }

  return { name: DEVICE_CONFIG.DEFAULTS.OS };
};

/**
 * Detect device type from user agent
 */
const detectDeviceType = (userAgent: string): DeviceType => {
  const ua = userAgent.toLowerCase();

  if (
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone/i.test(
      ua
    )
  ) {
    return DEVICE_TYPES.MOBILE;
  }

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return DEVICE_TYPES.TABLET;
  }

  if (/tv|smarttv|webos|tizen/i.test(ua)) {
    return DEVICE_TYPES.OTHER;
  }

  return DEVICE_TYPES.DESKTOP;
};

/**
 * Generate human-readable device name
 */
const generateDeviceName = (
  browser: string,
  os: string,
  _deviceType: DeviceType
): string => {
  if (browser === DEVICE_CONFIG.DEFAULTS.BROWSER) {
    return DEVICE_CONFIG.DEFAULTS.NAME;
  }

  return `${browser} on ${os}`;
};

/**
 * Get client IP from request
 * Handles proxies and load balancers
 */
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
