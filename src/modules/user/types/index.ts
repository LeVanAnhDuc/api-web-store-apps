// types
import type { Request } from "express";
import type { Schema } from "mongoose";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { GENDERS } from "@/modules/user/constants";

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  authId: Schema.Types.ObjectId;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  authId: Schema.Types.ObjectId;
  email: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
}

export interface UserRecord {
  _id: Schema.Types.ObjectId;
  email: string;
  fullName: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface PublicUserRecord {
  _id: Schema.Types.ObjectId;
  fullName: string;
  avatar?: string;
  gender?: Gender;
}

export interface UserWithAuth {
  user: UserDocument;
  auth: AuthenticationDocument;
}

export interface GetMyProfileRequest extends Omit<Request, "user"> {
  user: RequestUserPayload;
}

export interface UpdateProfileRequest extends Omit<Request, "user" | "body"> {
  user: RequestUserPayload;
  body: UpdateProfileData;
}

export interface UploadAvatarRequest extends Omit<Request, "user"> {
  user: RequestUserPayload;
  file?: Express.Multer.File;
}

export interface GetPublicProfileRequest extends Omit<Request, "params"> {
  params: { id: string };
}
