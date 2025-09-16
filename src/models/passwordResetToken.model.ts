// libs
import mongoose, { Document } from "mongoose";
// types
import type { IUserResetPasswordToken } from "../types/tokens";

const { Schema } = mongoose;

export interface IUserResetPasswordTokenDocument
  extends IUserResetPasswordToken,
    Document {}

const IUserResetPasswordTokenSchema = new Schema<IUserResetPasswordToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    usedAt: { type: Date, default: null },
    otpCode: { type: String, default: null },
    otpExpireAt: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpireAt: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false }
  },
  {
    collection: "user_reset_password_tokens",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

const UserResetPasswordToken = mongoose.model<IUserResetPasswordToken>(
  "UserResetPasswordToken",
  IUserResetPasswordTokenSchema
);

export default UserResetPasswordToken;
