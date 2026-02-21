import { UAParser } from "ua-parser-js";
import { DEVICE_TYPES, USER_AGENT_DEFAULTS } from "@/constants/enums";
import type { DeviceType } from "@/types/modules/login-history";

export interface ParsedUserAgent {
  deviceType: DeviceType;
  os: string;
  browser: string;
}

const MOBILE_DEVICE_TYPE = "mobile";
const TABLET_DEVICE_TYPE = "tablet";

export const parseUserAgent = (userAgent: string): ParsedUserAgent => {
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

const mapDeviceType = (deviceType?: string): DeviceType => {
  if (!deviceType) {
    return DEVICE_TYPES.DESKTOP;
  }

  const type = deviceType.toLowerCase();

  if (type === MOBILE_DEVICE_TYPE) return DEVICE_TYPES.MOBILE;
  if (type === TABLET_DEVICE_TYPE) return DEVICE_TYPES.TABLET;

  return DEVICE_TYPES.DESKTOP;
};
