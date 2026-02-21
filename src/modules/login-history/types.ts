import type { Schema, Document } from "mongoose";
import type { LoginMethod } from "@/modules/login/types";
import type {
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS
} from "@/modules/login/constants";
import type { Request } from "express";
import type { DEVICE_TYPES, CLIENT_TYPES } from "./constants";

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
