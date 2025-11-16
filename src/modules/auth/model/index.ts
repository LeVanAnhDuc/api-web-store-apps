// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { AuthDocument } from "@/shared/types/modules/auth";
// constants
import {
  AUTH_ROLES,
  PASSWORD_VALIDATION,
  EMAIL_FORMAT_PATTERN,
  SAFE_EMAIL_PATTERN
} from "@/shared/constants/auth";
import { MODEL_NAMES } from "@/shared/constants/models";

const { AUTHENTICATION } = MODEL_NAMES;

const AuthSchema = new Schema<AuthDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          // Check basic email format
          if (!EMAIL_FORMAT_PATTERN.test(email)) {
            return false;
          }
          // Check for dangerous Unicode characters
          if (!SAFE_EMAIL_PATTERN.test(email)) {
            return false;
          }
          return true;
        },
        message: "Please provide a valid email address"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [
        PASSWORD_VALIDATION.MIN_LENGTH,
        `Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters`
      ]
    },
    verifiedEmail: {
      type: Boolean,
      default: false
    },
    roles: {
      type: String,
      enum: Object.values(AUTH_ROLES),
      default: AUTH_ROLES.USER
    },
    refreshToken: {
      type: String,
      default: null
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    passwordResetToken: {
      type: String
    },
    passwordResetTokenExpiresAt: {
      type: Date
    }
  },
  {
    collection: "auths",
    timestamps: true
  }
);

/**
 * Indexes for better query performance
 */
AuthSchema.index({ email: 1 });
AuthSchema.index({ refreshToken: 1 });

const AuthModel: Model<AuthDocument> = model<AuthDocument>(
  AUTHENTICATION,
  AuthSchema
);

export default AuthModel;
