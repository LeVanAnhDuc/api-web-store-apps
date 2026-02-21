import UserModel from "@/modules/user/model";
import type { CreateUserData, UserRecord } from "./types";

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
