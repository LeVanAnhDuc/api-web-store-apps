import type { AuthDocument } from "@/modules/auth/types";
import AuthModel from "@/modules/auth/model";

export const findAuthByEmail = async (
  email: string
): Promise<AuthDocument | null> => AuthModel.findOne({ email }).exec();

/**
 * Find auth record by ID
 * @param authId - Auth document ID
 * @returns Auth document or null
 */
export const findAuthById = async (
  authId: string
): Promise<AuthDocument | null> => AuthModel.findById(authId).exec();

/**
 * Check if email exists (for passwordless account check)
 * @param email - User email
 * @returns true if email exists
 */
export const emailExists = async (email: string): Promise<boolean> => {
  const auth = await AuthModel.findOne({ email }).lean().exec();
  return auth !== null;
};

/**
 * Check if auth has password set (vs passwordless account)
 * @param email - User email
 * @returns true if has password, false if passwordless or not found
 */
export const hasPassword = async (email: string): Promise<boolean> => {
  const auth = await AuthModel.findOne({ email })
    .select("password")
    .lean()
    .exec();
  return auth !== null && auth.password !== null && auth.password !== "";
};

export const updateLastLogin = async (authId: string): Promise<void> => {
  await AuthModel.findByIdAndUpdate(authId, { lastLogin: new Date() }).exec();
};

/**
 * Check if account is active
 * @param email - User email
 * @returns true if active, false otherwise
 */
export const isAccountActive = async (email: string): Promise<boolean> => {
  const auth = await AuthModel.findOne({ email })
    .select("isActive")
    .lean()
    .exec();
  return auth?.isActive ?? false;
};

/**
 * Check if email is verified
 * @param email - User email
 * @returns true if verified, false otherwise
 */
export const isEmailVerified = async (email: string): Promise<boolean> => {
  const auth = await AuthModel.findOne({ email })
    .select("verifiedEmail")
    .lean()
    .exec();
  return auth?.verifiedEmail ?? false;
};
