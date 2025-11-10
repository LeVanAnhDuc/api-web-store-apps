// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { AuthDocument } from "@/shared/types/modules/auth";
// constants
import { AUTH_ROLES } from "@/shared/constants/auth";
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
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [8, "Password must be at least 8 characters"]
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
