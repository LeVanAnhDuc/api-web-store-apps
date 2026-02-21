import { getLoginHistoryRepository } from "@/repositories/login-history";
import { extractIp } from "@/modules/login-history/utils/extractIp";
import { parseUserAgent } from "@/modules/login-history/utils/parseUserAgent";
import { geoipLookup } from "@/modules/login-history/utils/geoipLookup";
import { CLIENT_TYPES } from "@/constants/enums";
import { HTTP_HEADERS } from "@/constants/infrastructure";
import type {
  LoginEventPayload,
  ClientType
} from "@/types/modules/login-history";
import Logger from "@/utils/logger";

export const logLoginAttempt = async (
  payload: LoginEventPayload
): Promise<void> => {
  try {
    const {
      userId,
      usernameAttempted,
      status,
      failReason,
      loginMethod,
      req,
      timezoneOffset
    } = payload;

    const ip = extractIp(req);
    const userAgent = req.headers[HTTP_HEADERS.USER_AGENT] || "";
    const clientTypeHeader = req.headers[HTTP_HEADERS.CLIENT_TYPE] as
      | string
      | undefined;

    const clientType: ClientType = determineClientType(clientTypeHeader);

    const { deviceType, os, browser } = parseUserAgent(userAgent);

    const { country, city } = geoipLookup(ip);

    const loginHistoryData = {
      userId,
      usernameAttempted,
      method: loginMethod,
      status,
      failReason,
      ip,
      country,
      city,
      deviceType,
      os,
      browser,
      userAgent,
      clientType,
      timezoneOffset: timezoneOffset || null,
      isAnomaly: false,
      anomalyReasons: []
    };

    await getLoginHistoryRepository().create(loginHistoryData);

    Logger.info("Login history logged successfully", {
      userId,
      usernameAttempted,
      status,
      loginMethod
    });
  } catch (error) {
    Logger.error("Failed to log login history", {
      error,
      payload: {
        userId: payload.userId,
        usernameAttempted: payload.usernameAttempted,
        status: payload.status,
        loginMethod: payload.loginMethod
      }
    });
  }
};

const determineClientType = (clientTypeHeader?: string): ClientType => {
  if (!clientTypeHeader) {
    return CLIENT_TYPES.WEB;
  }

  const type = clientTypeHeader.toLowerCase();

  if (type === "mobile_ios" || type === "ios") return CLIENT_TYPES.MOBILE_IOS;
  if (type === "mobile_android" || type === "android")
    return CLIENT_TYPES.MOBILE_ANDROID;

  return CLIENT_TYPES.WEB;
};
