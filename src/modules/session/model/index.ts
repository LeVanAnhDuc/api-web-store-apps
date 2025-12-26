// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { SessionDocument } from "@/shared/types/modules/session";
// constants
import { MODEL_NAMES } from "@/shared/constants/models";
import {
  DEVICE_TYPES,
  DEVICE_CONFIG,
  LOGIN_METHODS,
  LOGIN_SESSION_CONFIG
} from "@/shared/constants/modules/session";

const { SESSION, AUTHENTICATION } = MODEL_NAMES;

/**
 * Device sub-schema for embedded device information
 */
const DeviceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: DEVICE_CONFIG.MAX_NAME_LENGTH,
      default: DEVICE_CONFIG.DEFAULTS.NAME
    },
    type: {
      type: String,
      enum: Object.values(DEVICE_TYPES),
      default: DEVICE_CONFIG.DEFAULTS.TYPE
    },
    browser: {
      type: String,
      trim: true,
      maxlength: DEVICE_CONFIG.MAX_BROWSER_LENGTH,
      default: DEVICE_CONFIG.DEFAULTS.BROWSER
    },
    browserVersion: {
      type: String,
      trim: true,
      maxlength: 20
    },
    os: {
      type: String,
      trim: true,
      maxlength: DEVICE_CONFIG.MAX_OS_LENGTH,
      default: DEVICE_CONFIG.DEFAULTS.OS
    },
    osVersion: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  { _id: false }
);

/**
 * Location sub-schema for embedded location information
 */
const LocationSchema = new Schema(
  {
    country: {
      type: String,
      trim: true,
      maxlength: 100
    },
    countryCode: {
      type: String,
      trim: true,
      maxlength: 3
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    region: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  { _id: false }
);

/**
 * Session Schema
 *
 * Design Decisions:
 * 1. userId references Authentication (not User) for authentication purposes
 * 2. refreshTokenHash stores hashed token for secure comparison
 * 3. device is embedded (not referenced) for performance
 * 4. location is optional for privacy compliance
 * 5. expiresAt uses TTL index for auto-cleanup (7 days)
 * 6. lastActive tracks activity for 30-day inactive cleanup
 * 7. isRevoked provides soft delete for immediate invalidation
 *
 * Indexes designed for:
 * - Find sessions by user (userId)
 * - Find active sessions (userId + isRevoked)
 * - Auto-delete expired sessions (expiresAt TTL)
 * - Cleanup inactive sessions (lastActive)
 */
const SessionSchema = new Schema<SessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: AUTHENTICATION,
      required: [true, "User ID is required"],
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
      select: false
    },
    device: {
      type: DeviceSchema,
      required: [true, "Device information is required"]
    },
    ip: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
      maxlength: 45
    },
    location: {
      type: LocationSchema,
      required: false
    },
    loginMethod: {
      type: String,
      enum: Object.values(LOGIN_METHODS),
      required: [true, "Login method is required"],
      default: LOGIN_METHODS.PASSWORD
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      default: () =>
        new Date(
          Date.now() + LOGIN_SESSION_CONFIG.REFRESH_TOKEN_EXPIRY_SECONDS * 1000
        )
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    collection: "sessions",
    timestamps: true
  }
);

/**
 * Indexes for query optimization
 *
 * 1. Compound index for finding active sessions per user
 *    Query: SessionModel.find({ userId, isRevoked: false })
 *
 * 2. TTL index for automatic session expiration
 *    MongoDB automatically deletes documents when expiresAt passes
 *
 * 3. lastActive index for inactive session cleanup job
 *    Query: SessionModel.deleteMany({ lastActive: { $lt: cutoffDate } })
 */
SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Pre-save middleware to update lastActive on save
 */
SessionSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

/**
 * Instance method to check if session is valid
 */
SessionSchema.methods.isValid = function (): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

/**
 * Instance method to revoke session
 */
SessionSchema.methods.revoke = function (): void {
  this.isRevoked = true;
  this.revokedAt = new Date();
};

const SessionModel: Model<SessionDocument> = model<SessionDocument>(
  SESSION,
  SessionSchema
);

export default SessionModel;
