import type { Schema } from "mongoose";

import AuthenticationModel from "@/modules/authentication/model";

import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";

interface CreateAuthenticationData {
  email: string;
  hashedPassword: string;
}

interface AuthenticationRecord {
  _id: Schema.Types.ObjectId;
  email: string;
  roles: string;
}

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
