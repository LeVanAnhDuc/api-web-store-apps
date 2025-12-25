/**
 * Auth Repository
 * Encapsulates Auth model database operations for Signup module
 * Service layer should NOT query DB directly - use this repository
 */

// types
import type { Schema } from "mongoose";

// models
import AuthModel from "@/modules/auth/model";

// constants
import { AUTH_ROLES } from "@/shared/constants/modules/auth";

interface CreateAuthData {
  email: string;
  hashedPassword: string;
}

interface AuthRecord {
  _id: Schema.Types.ObjectId;
  email: string;
  roles: string;
}

/**
 * Check if email is already registered
 * @param email - Email to check
 * @returns true if email exists in database
 */
export const isEmailRegistered = async (email: string): Promise<boolean> => {
  const existingAuth = await AuthModel.findOne({ email }).lean();
  return existingAuth !== null;
};

/**
 * Create new auth record for signup
 * @param data - Auth data with email and hashed password
 * @returns Created auth record
 */
export const createAuthRecord = async (
  data: CreateAuthData
): Promise<AuthRecord> => {
  const auth = await AuthModel.create({
    email: data.email,
    password: data.hashedPassword,
    verifiedEmail: true,
    roles: AUTH_ROLES.USER,
    isActive: true
  });

  return {
    _id: auth._id,
    email: auth.email,
    roles: auth.roles
  };
};

/**
 * Store refresh token for auth record
 * @param authId - Auth record ID
 * @param refreshToken - JWT refresh token
 */
export const storeRefreshToken = async (
  authId: Schema.Types.ObjectId,
  refreshToken: string
): Promise<void> => {
  await AuthModel.findByIdAndUpdate(authId, { refreshToken });
};
