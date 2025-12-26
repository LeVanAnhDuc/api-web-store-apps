// libs
import type { Schema, Document } from "mongoose";
// types
import type {
  DeviceInfo,
  LocationInfo,
  LoginMethod
} from "@/shared/types/modules/session";
// constants
import type {
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS
} from "@/shared/constants/modules/session";

/**
 * Login status type
 */
export type LoginStatus = (typeof LOGIN_STATUSES)[keyof typeof LOGIN_STATUSES];

/**
 * Login failure reason type
 */
export type LoginFailReason =
  (typeof LOGIN_FAIL_REASONS)[keyof typeof LOGIN_FAIL_REASONS];

/**
 * LoginHistory document interface for MongoDB
 *
 * Design Decisions:
 * - userId: Reference to Auth collection for tracking
 * - method: How user attempted to login
 * - status: Success or failed
 * - failReason: Why login failed (for debugging/security)
 * - device: Captured device info at login time
 * - location: Captured location for security alerts
 * - TTL: 90 days auto-delete via MongoDB TTL index
 *
 * Note: State vs History separation
 * - Session: Current state (active sessions)
 * - LoginHistory: Historical record (audit log)
 */
export interface LoginHistoryDocument extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  userAgent: string;
  createdAt: Date;
}

/**
 * Create login history input DTO
 */
export interface CreateLoginHistoryInput {
  userId: Schema.Types.ObjectId | string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  userAgent: string;
}

/**
 * Login history response for API
 */
export interface LoginHistoryResponse {
  id: string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  createdAt: Date;
}

/**
 * Login history filter options
 */
export interface LoginHistoryFilter {
  userId?: string;
  method?: LoginMethod;
  status?: LoginStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
