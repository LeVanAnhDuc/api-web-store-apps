/**
 * User Repository
 * Encapsulates User model database operations for Signup module
 * Service layer should NOT query DB directly - use this repository
 */

import type { Schema } from "mongoose";
import type { Gender } from "@/modules/user/types";

import UserModel from "@/modules/user/model";

interface CreateUserData {
  authId: Schema.Types.ObjectId;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
}

interface UserRecord {
  _id: Schema.Types.ObjectId;
  fullName: string;
}

/**
 * Create new user profile for signup
 * @param data - User profile data
 * @returns Created user record with id and fullName
 */
export const createUserProfile = async (
  data: CreateUserData
): Promise<UserRecord> => {
  const user = await UserModel.create({
    authId: data.authId,
    fullName: data.fullName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth
  });

  return {
    _id: user._id,
    fullName: user.fullName
  };
};
