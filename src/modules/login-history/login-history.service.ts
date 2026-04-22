// types
import type { Schema } from "mongoose";
import type { Request } from "express";
import type { LoginHistoryRepository } from "./login-history.repository";
import type {
  LoginEventPayload,
  ClientType,
  LoginHistoryQuery,
  LoginHistoryAdminQuery,
  PaginatedResult,
  LoginMethod,
  LoginFailReason
} from "@/modules/login-history/types";
import type { MyHistoryItemDto, AllHistoryItemDto } from "./dtos";
// dtos
import { toMyHistoryItemDto, toAllHistoryItemDto } from "./dtos";
// others
import {
  LOGIN_STATUSES,
  HTTP_HEADERS
} from "@/modules/login-history/constants";
import { Logger } from "@/utils/logger";
// helpers
import {
  extractIp,
  parseUserAgent,
  geoipLookup,
  determineClientType,
  buildLoginHistoryFilter
} from "./helpers";

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
  ): Promise<PaginatedResult<MyHistoryItemDto>> {
    const {
      page = DEFAULT_PAGE,
      limit: rawLimit = DEFAULT_LIMIT,
      sortBy = "createdAt",
      sortOrder: rawSortOrder
    } = query;
    const limit = Math.min(rawLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;

    const filter = buildLoginHistoryFilter(
      query as LoginHistoryAdminQuery,
      userId
    );
    const { data, total } = await this.loginHistoryRepo.findByUser(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    return {
      items: data.map(toMyHistoryItemDto),
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
  ): Promise<PaginatedResult<AllHistoryItemDto>> {
    const {
      page = DEFAULT_PAGE,
      limit: rawLimit = DEFAULT_LIMIT,
      sortBy = "createdAt",
      sortOrder: rawSortOrder
    } = query;
    const limit = Math.min(rawLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortOrder = rawSortOrder === "asc" ? 1 : -1;

    const filter = buildLoginHistoryFilter(query);
    const { data, total } = await this.loginHistoryRepo.findAll(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    return {
      items: data.map(toAllHistoryItemDto),
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
