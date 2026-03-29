import type { Schema, Document } from "mongoose";
import type { Request } from "express";
import type { LoginMethod } from "@/types/modules/login";
import type {
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS,
  DEVICE_TYPES,
  CLIENT_TYPES
} from "@/constants/modules/login-history";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LoginHistoryQuery extends PaginationParams {
  status?: LoginStatus;
  method?: LoginMethod;
  deviceType?: DeviceType;
  clientType?: ClientType;
  country?: string;
  city?: string;
  os?: string;
  browser?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "method" | "status" | "country";
  sortOrder?: "asc" | "desc";
}

export interface LoginHistoryAdminQuery extends LoginHistoryQuery {
  userId?: string;
  ip?: string;
  sortBy?:
    | "createdAt"
    | "method"
    | "status"
    | "country"
    | "ip"
    | "usernameAttempted";
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MyHistoryRequest extends Omit<Request, "query" | "user"> {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
  query: LoginHistoryQuery;
}

export interface AllHistoryRequest extends Omit<Request, "query"> {
  query: LoginHistoryAdminQuery;
}

export type LoginStatus = (typeof LOGIN_STATUSES)[keyof typeof LOGIN_STATUSES];

export type LoginFailReason =
  (typeof LOGIN_FAIL_REASONS)[keyof typeof LOGIN_FAIL_REASONS];

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];

export type ClientType = (typeof CLIENT_TYPES)[keyof typeof CLIENT_TYPES];

export interface LoginHistoryDocument extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId | null;
  usernameAttempted: string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
  country: string;
  city: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  userAgent: string;
  clientType: ClientType;
  timezoneOffset: string | null;
  isAnomaly: boolean;
  anomalyReasons: string[];
  createdAt: Date;
}

export interface CreateLoginHistoryData {
  userId: Schema.Types.ObjectId | string | null;
  usernameAttempted: string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
  country: string;
  city: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  userAgent: string;
  clientType: ClientType;
  timezoneOffset: string | null;
  isAnomaly: boolean;
  anomalyReasons: string[];
}

export interface LoginEventPayload {
  userId: string | null;
  usernameAttempted: string;
  status: LoginStatus;
  failReason?: LoginFailReason;
  loginMethod: LoginMethod;
  req: Request;
  timezoneOffset?: string;
}
