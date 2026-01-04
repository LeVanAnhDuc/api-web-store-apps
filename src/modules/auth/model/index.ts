import { Schema, model, type Model } from "mongoose";
import type { AuthDocument } from "@/shared/types/modules/auth";
import {
  AUTH_ROLES,
  EMAIL_FORMAT_PATTERN,
  SAFE_EMAIL_PATTERN
} from "@/shared/constants/modules/auth";
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
          if (!EMAIL_FORMAT_PATTERN.test(email)) {
            return false;
          }
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
      required: [true, "Password is required"]
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: "auths",
    timestamps: true
  }
);

AuthSchema.index({ email: 1 });

const AuthModel: Model<AuthDocument> = model<AuthDocument>(
  AUTHENTICATION,
  AuthSchema
);

export default AuthModel;
