// libs
import type { Schema } from "mongoose";
// constants
import type { AUTH_ROLES } from "@/shared/constants/modules/auth";

export type TAuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export interface AuthDocument {
  _id: Schema.Types.ObjectId;
  email: string;
  password: string;
  verifiedEmail: boolean;
  roles: TAuthRole;
  refreshToken: string | null;
  isActive: boolean;
  lastLogin: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
