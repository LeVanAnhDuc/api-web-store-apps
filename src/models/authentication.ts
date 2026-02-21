import { Schema, model, type Model } from "mongoose";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import { MODEL_NAMES } from "@/constants/models";
import { AUTHENTICATION_ROLES } from "@/constants/enums";
import {
  EMAIL_FORMAT_PATTERN,
  SAFE_EMAIL_PATTERN
} from "@/validators/constants";

const { AUTHENTICATION } = MODEL_NAMES;

const AuthenticationSchema = new Schema<AuthenticationDocument>(
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
      enum: Object.values(AUTHENTICATION_ROLES),
      default: AUTHENTICATION_ROLES.USER
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tempPasswordHash: {
      type: String,
      default: null
    },
    tempPasswordExpAt: {
      type: Date,
      default: null
    },
    tempPasswordUsed: {
      type: Boolean,
      default: false
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: "auths",
    timestamps: true
  }
);

AuthenticationSchema.index({ email: 1 });

const AuthenticationModel: Model<AuthenticationDocument> =
  model<AuthenticationDocument>(AUTHENTICATION, AuthenticationSchema);

export default AuthenticationModel;
