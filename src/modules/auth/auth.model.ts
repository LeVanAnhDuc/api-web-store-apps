// libs
import mongoose from "mongoose";
// types
import { ERole, type IAuthDocument } from "@/types/modules/auth";

const { Schema } = mongoose;

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

const AuthModel = mongoose.model<IAuthDocument>("Authentication", AuthSchema);

export default AuthModel;
