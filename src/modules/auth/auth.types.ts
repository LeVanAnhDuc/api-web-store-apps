// libs
import type { Document, Schema } from "mongoose";

/* eslint-disable no-unused-vars */
export enum ERole {
  ADMIN = "ADMIN",
  USER = "USER"
}
/* eslint-enable no-unused-vars */
export type TRole = `${ERole}`;

export interface IAuth {
  email: string;
  verifiedEmail: boolean;
  password: string;
  roles: TRole;
  refreshToken: string;
  passwordResetToken: string;
  passwordResetTokenExpiresAt: Date;
  lastLogin: Date;
}

export interface IAuthDocument extends IAuth, Document {
  _id: Schema.Types.ObjectId;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
}
