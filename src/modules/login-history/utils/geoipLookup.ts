import Logger from "@/infra/utils/logger";
import geoip from "geoip-lite";
import { GEO_DEFAULTS } from "@/modules/login-history/constants";

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
