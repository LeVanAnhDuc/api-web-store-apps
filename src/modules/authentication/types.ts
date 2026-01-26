import type { Schema } from "mongoose";
import type { AUTHENTICATION_ROLES } from "./constants";

export type AuthenticationRole =
  (typeof AUTHENTICATION_ROLES)[keyof typeof AUTHENTICATION_ROLES];

export interface AuthenticationDocument {
  _id: Schema.Types.ObjectId;
  email: string;
  password: string;
  verifiedEmail: boolean;
  roles: AuthenticationRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
