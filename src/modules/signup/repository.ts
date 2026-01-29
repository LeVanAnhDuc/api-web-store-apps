import type { Schema } from "mongoose";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";
import AuthenticationModel from "@/modules/authentication/model";
import UserModel from "@/modules/user/model";
import type {
  AuthenticationRecord,
  CreateAuthenticationData,
  CreateUserData,
  UserRecord
} from "./types";

export const isEmailRegistered = async (email: string): Promise<boolean> => {
  const existingAuthentication = await AuthenticationModel.findOne({
    email
  }).lean();
  return existingAuthentication !== null;
};

export const createAuthenticationRecord = async (
  data: CreateAuthenticationData
): Promise<AuthenticationRecord> => {
  const authentication = await AuthenticationModel.create({
    email: data.email,
    password: data.hashedPassword,
    verifiedEmail: true,
    roles: AUTHENTICATION_ROLES.USER,
    isActive: true
  });

  return {
    _id: authentication._id,
    email: authentication.email,
    roles: authentication.roles
  };
};

export const storeRefreshToken = async (
  authId: Schema.Types.ObjectId,
  refreshToken: string
): Promise<void> => {
  await AuthenticationModel.findByIdAndUpdate(authId, { refreshToken });
};

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
