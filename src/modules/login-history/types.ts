import type { Schema, Document } from "mongoose";
import type { LoginMethod } from "@/modules/login/types";
import type {
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS
} from "@/modules/login/constants";

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
 * LoginHistory document interface for MongoDB (Simplified)
 *
 * Design Decisions:
 * - userId: Reference to Auth collection for tracking
 * - method: How user attempted to login
 * - status: Success or failed
 * - failReason: Why login failed (for debugging/security)
 * - ip: Client IP address for security analysis
 * - TTL: 90 days auto-delete via MongoDB TTL index
 *
 * Simplified: No device/location tracking
 */
export interface LoginHistoryDocument extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
  createdAt: Date;
}

/**
 * Create login history input DTO (Simplified)
 */
export interface CreateLoginHistoryInput {
  userId: Schema.Types.ObjectId | string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
}

/**
 * Login history response for API (Simplified)
 */
export interface LoginHistoryResponse {
  id: string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
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
