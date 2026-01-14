import type { Schema } from "mongoose";
import type { AUTH_ROLES } from "./constants";

export type TAuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export interface AuthDocument {
  _id: Schema.Types.ObjectId;
  email: string;
  password: string;
  verifiedEmail: boolean;
  roles: TAuthRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
