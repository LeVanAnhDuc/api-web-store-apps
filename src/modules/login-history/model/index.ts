import { Schema, model, type Model } from "mongoose";
import type { LoginHistoryDocument } from "@/modules/login-history/types";
import { MODEL_NAMES } from "@/app/constants/models";
import {
  LOGIN_METHODS,
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS,
  LOGIN_HISTORY_CONFIG
} from "@/modules/login/constants";

const { LOGIN_HISTORY, AUTHENTICATION } = MODEL_NAMES;

/**
 * LoginHistory Schema (Simplified)
 *
 * Design Decisions:
 * 1. Immutable audit log - no updates, only inserts
 * 2. TTL index auto-deletes after 90 days (compliance)
 * 3. Tracks both success and failed attempts for security
 * 4. Simplified - no device/location tracking
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
    ip: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
      maxlength: 45
    }
  },
  {
    collection: "login_histories",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

/**
 * Indexes for query optimization
 */
LoginHistorySchema.index({ userId: 1, createdAt: -1 });
LoginHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: LOGIN_HISTORY_CONFIG.TTL_SECONDS }
);
LoginHistorySchema.index({ ip: 1, status: 1, createdAt: -1 });

const LoginHistoryModel: Model<LoginHistoryDocument> =
  model<LoginHistoryDocument>(LOGIN_HISTORY, LoginHistorySchema);

export default LoginHistoryModel;
