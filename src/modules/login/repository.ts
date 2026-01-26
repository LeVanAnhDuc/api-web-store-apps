import type { AuthenticationDocument } from "@/modules/authentication/types";
import AuthenticationModel from "@/modules/authentication/model";

export const findAuthenticationByEmail = async (
  email: string
): Promise<AuthenticationDocument | null> =>
  AuthenticationModel.findOne({ email }).exec();

export const findAuthenticationById = async (
  authId: string
): Promise<AuthenticationDocument | null> =>
  AuthenticationModel.findById(authId).exec();

export const emailExists = async (email: string): Promise<boolean> => {
  const authentication = await AuthenticationModel.findOne({ email })
    .lean()
    .exec();
  return authentication !== null;
};

export const hasPassword = async (email: string): Promise<boolean> => {
  const authentication = await AuthenticationModel.findOne({ email })
    .select("password")
    .lean()
    .exec();
  return (
    authentication !== null &&
    authentication.password !== null &&
    authentication.password !== ""
  );
};

export const updateLastLogin = async (authId: string): Promise<void> => {
  await AuthenticationModel.findByIdAndUpdate(authId, {
    lastLogin: new Date()
  }).exec();
};

export const isAccountActive = async (email: string): Promise<boolean> => {
  const authentication = await AuthenticationModel.findOne({ email })
    .select("isActive")
    .lean()
    .exec();
  return authentication?.isActive ?? false;
};

export const isEmailVerified = async (email: string): Promise<boolean> => {
  const authentication = await AuthenticationModel.findOne({ email })
    .select("verifiedEmail")
    .lean()
    .exec();
  return authentication?.verifiedEmail ?? false;
};
