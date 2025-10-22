// libs
import type { Model } from "mongoose";
import { Schema, model } from "mongoose";
// types
import { ERole, type IAuthDocument } from "@/types/modules/auth";
// others
import CONSTANTS from "@/constants";

const { AUTHENTICATION } = CONSTANTS.MODEL_NAME;

const AuthSchema = new Schema<IAuthDocument>(
  {
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true
    },
    password: { type: String, trim: true },
    verifiedEmail: { type: Boolean, default: true },
    roles: { type: String, enum: Object.values(ERole), default: ERole.USER },
    refreshToken: { type: String, default: null },
    lastLogin: { type: Date, default: Date.now },
    passwordResetToken: String,
    passwordResetTokenExpiresAt: Date
  },
  {
    collection: "auth",
    timestamps: true
  }
);

const AuthModel: Model<IAuthDocument> = model<IAuthDocument>(
  AUTHENTICATION,
  AuthSchema
);

export default AuthModel;
