// libs
import type { Document, Schema } from "mongoose";

export enum ERole {
  // eslint-disable-next-line no-unused-vars
  ADMIN = "ADMIN",
  // eslint-disable-next-line no-unused-vars
  USER = "USER"
}
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
