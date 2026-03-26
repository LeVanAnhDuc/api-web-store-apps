import type { Schema } from "mongoose";
import type { Request } from "express";
import type { LoginHistoryRepository } from "@/repositories/login-history.repository";
import type {
  LoginEventPayload,
  ClientType,
  LoginFailReason,
  LoginHistoryQuery,
  LoginHistoryAdminQuery,
  LoginHistoryItem,
  LoginHistoryAdminItem,
  PaginatedResult
} from "@/types/modules/login-history";
import type { LoginMethod } from "@/types/modules/login";
import {
  LOGIN_STATUSES,
  HTTP_HEADERS
} from "@/constants/modules/login-history";
import Logger from "@/utils/logger";
import {
  extractIp,
  parseUserAgent,
  geoipLookup,
  determineClientType,
  maskIp
} from "./internals/helpers";
import { buildLoginHistoryFilter } from "./internals/query-builder";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class LoginHistoryService {
  constructor(private readonly loginHistoryRepo: LoginHistoryRepository) {}

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

  async getMyLoginHistory(
    userId: string,
    query: LoginHistoryQuery
  ): Promise<PaginatedResult<LoginHistoryItem>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    const filter = buildLoginHistoryFilter(
      query as LoginHistoryAdminQuery,
      userId
    );
    const { data, total } = await this.loginHistoryRepo.findByUser(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    const items: LoginHistoryItem[] = data.map((record) => ({
      _id: record._id.toString(),
      method: record.method,
      status: record.status,
      failReason: record.failReason ?? null,
      ip: maskIp(record.ip),
      country: record.country,
      city: record.city,
      deviceType: record.deviceType,
      os: record.os,
      browser: record.browser,
      clientType: record.clientType,
      createdAt: record.createdAt.toISOString()
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAllLoginHistory(
    query: LoginHistoryAdminQuery
  ): Promise<PaginatedResult<LoginHistoryAdminItem>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    const filter = buildLoginHistoryFilter(query);
    const { data, total } = await this.loginHistoryRepo.findAll(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    const items: LoginHistoryAdminItem[] = data.map((record) => ({
      _id: record._id.toString(),
      method: record.method,
      status: record.status,
      failReason: record.failReason ?? null,
      ip: record.ip,
      country: record.country,
      city: record.city,
      deviceType: record.deviceType,
      os: record.os,
      browser: record.browser,
      clientType: record.clientType,
      createdAt: record.createdAt.toISOString(),
      userId: record.userId ? record.userId.toString() : null,
      usernameAttempted: record.usernameAttempted,
      userAgent: record.userAgent,
      timezoneOffset: record.timezoneOffset,
      isAnomaly: record.isAnomaly,
      anomalyReasons: record.anomalyReasons
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
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
