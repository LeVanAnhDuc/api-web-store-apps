// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { LoginHistoryDocument } from "@/shared/types/modules/login-history";
// constants
import { MODEL_NAMES } from "@/shared/constants/models";
import {
  DEVICE_TYPES,
  DEVICE_CONFIG,
  LOGIN_METHODS,
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS,
  LOGIN_HISTORY_CONFIG
} from "@/shared/constants/modules/session";

const { LOGIN_HISTORY, AUTHENTICATION } = MODEL_NAMES;

/**
 * Device sub-schema for embedded device information
 * Reused structure from Session model
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
 * LoginHistory Schema
 *
 * Design Decisions:
 * 1. Immutable audit log - no updates, only inserts
 * 2. TTL index auto-deletes after 90 days (compliance)
 * 3. Stores snapshot of device/location at login time
 * 4. Tracks both success and failed attempts for security
 *
 * Use Cases:
 * - Security: Detect suspicious login patterns
 * - Audit: Compliance with login attempt logging
 * - UX: Show recent login history to users
 * - Analytics: Login method usage statistics
 *
 * State vs History:
 * - Session: Current active state
 * - LoginHistory: Historical audit log
 */
const LoginHistorySchema = new Schema<LoginHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: AUTHENTICATION,
      required: [true, "User ID is required"],
      index: true
    },
    method: {
      type: String,
      enum: Object.values(LOGIN_METHODS),
      required: [true, "Login method is required"]
    },
    status: {
      type: String,
      enum: Object.values(LOGIN_STATUSES),
      required: [true, "Login status is required"]
    },
    failReason: {
      type: String,
      enum: Object.values(LOGIN_FAIL_REASONS),
      default: null
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
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
      trim: true,
      maxlength: 500
    }
  },
  {
    collection: "login_histories",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

/**
 * Indexes for query optimization
 *
 * 1. Compound index for user history with date sorting
 *    Query: LoginHistoryModel.find({ userId }).sort({ createdAt: -1 })
 *
 * 2. TTL index for automatic cleanup after 90 days
 *    Compliant with data retention policies
 *
 * 3. Index for security analysis queries
 *    Query: Find failed attempts by IP, status patterns
 */
LoginHistorySchema.index({ userId: 1, createdAt: -1 });
LoginHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: LOGIN_HISTORY_CONFIG.TTL_SECONDS }
);
LoginHistorySchema.index({ ip: 1, status: 1, createdAt: -1 });
LoginHistorySchema.index({ userId: 1, status: 1, createdAt: -1 });

const LoginHistoryModel: Model<LoginHistoryDocument> =
  model<LoginHistoryDocument>(LOGIN_HISTORY, LoginHistorySchema);

export default LoginHistoryModel;
