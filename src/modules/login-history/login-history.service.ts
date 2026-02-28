import type loginHistoryRepository from "@/repositories/login-history";
import { HTTP_HEADERS } from "@/constants/infrastructure";
import type {
  LoginEventPayload,
  ClientType
} from "@/types/modules/login-history";
import Logger from "@/utils/logger";
import {
  extractIp,
  parseUserAgent,
  geoipLookup,
  determineClientType
} from "./internals/helpers";

export class LoginHistoryService {
  constructor(
    private readonly loginHistoryRepo: typeof loginHistoryRepository
  ) {}

  async logLoginAttempt(payload: LoginEventPayload): Promise<void> {
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

      await this.loginHistoryRepo.create(loginHistoryData);

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
  }
}
