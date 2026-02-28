import type { Schema } from "mongoose";
import type { Request } from "express";
import type loginHistoryRepository from "@/repositories/login-history";
import { HTTP_HEADERS } from "@/constants/infrastructure";
import type {
  LoginEventPayload,
  ClientType,
  LoginFailReason
} from "@/types/modules/login-history";
import type { LoginMethod } from "@/types/modules/login";
import { LOGIN_STATUSES } from "@/constants/enums";
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

  recordSuccessfulLogin({
    userId,
    usernameAttempted,
    loginMethod,
    req
  }: {
    userId: Schema.Types.ObjectId | string;
    usernameAttempted: string;
    loginMethod: LoginMethod;
    req: Request;
  }): void {
    this.logLoginAttempt({
      userId: userId.toString(),
      usernameAttempted,
      status: LOGIN_STATUSES.SUCCESS,
      loginMethod,
      req
    });
  }

  recordFailedLogin({
    userId,
    usernameAttempted,
    loginMethod,
    failReason,
    req
  }: {
    userId?: Schema.Types.ObjectId | string | null;
    usernameAttempted: string;
    loginMethod: LoginMethod;
    failReason: LoginFailReason;
    req: Request;
  }): void {
    this.logLoginAttempt({
      userId: userId ? userId.toString() : null,
      usernameAttempted,
      status: LOGIN_STATUSES.FAILED,
      failReason,
      loginMethod,
      req
    });
  }

  private async logLoginAttempt(payload: LoginEventPayload): Promise<void> {
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
