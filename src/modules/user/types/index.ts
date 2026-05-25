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

export interface UserAddressDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  street: string;
  city: string;
  province: string;
  country: string;
  postalCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GetMyProfileRequest = Request;

export interface UpdateProfileRequest extends Omit<Request, "body"> {
  body: UpdateProfileData;
}

export interface UploadAvatarRequest extends Request {
  file?: Express.Multer.File;
}

export interface GetPublicProfileRequest extends Omit<Request, "params"> {
  params: { id: string };
}
