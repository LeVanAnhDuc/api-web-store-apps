// libs
import type { Schema, Document } from "mongoose";
// constants
import type {
  DEVICE_TYPES,
  LOGIN_METHODS
} from "@/shared/constants/modules/session";

/**
 * Device type derived from DEVICE_TYPES constant
 */
export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];

/**
 * Login method type derived from LOGIN_METHODS constant
 */
export type LoginMethod = (typeof LOGIN_METHODS)[keyof typeof LOGIN_METHODS];

/**
 * Device information embedded in Session
 */
export interface DeviceInfo {
  name: string;
  type: DeviceType;
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
}

/**
 * Location information embedded in Session
 */
export interface LocationInfo {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
}

/**
 * Session document interface for MongoDB
 *
 * Design Decisions:
 * - userId: Reference to Auth collection (not User) for authentication
 * - refreshTokenHash: Hashed refresh token for secure rotation
 * - device: Embedded document for device tracking
 * - location: Embedded document for security alerts
 * - loginMethod: How user logged in (password, otp, magic-link)
 * - isRevoked: Soft delete for session invalidation
 * - expiresAt: TTL index for auto-cleanup
 * - lastActive: For 30-day inactivity cleanup
 */
export interface SessionDocument extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  refreshTokenHash: string;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  loginMethod: LoginMethod;
  isRevoked: boolean;
  revokedAt?: Date;
  expiresAt: Date;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create session input DTO
 */
export interface CreateSessionInput {
  userId: Schema.Types.ObjectId | string;
  refreshTokenHash: string;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  loginMethod: LoginMethod;
  expiresAt: Date;
}

/**
 * Update session input DTO
 */
export interface UpdateSessionInput {
  refreshTokenHash?: string;
  lastActive?: Date;
  isRevoked?: boolean;
  revokedAt?: Date;
}

/**
 * Session response for API (without sensitive data)
 */
export interface SessionResponse {
  id: string;
  device: DeviceInfo;
  ip: string;
  location?: LocationInfo;
  loginMethod: LoginMethod;
  lastActive: Date;
  createdAt: Date;
  isCurrent?: boolean;
}
