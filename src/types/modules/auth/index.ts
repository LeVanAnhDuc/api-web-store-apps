// libs
import { Document, Schema } from "mongoose";

export enum ERole {
  ADMIN = "ADMIN",
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
