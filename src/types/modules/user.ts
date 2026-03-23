import type { Request } from "express";
import type { Schema } from "mongoose";
import type { GENDERS } from "@/constants/enums";

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  authId: Schema.Types.ObjectId;
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
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
}

export interface UserRecord {
  _id: Schema.Types.ObjectId;
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

export interface MyProfileResponse {
  _id: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string;
  createdAt: string;
}

export interface PublicProfileResponse {
  _id: string;
  fullName: string;
  avatar: string | null;
  gender: string | null;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

export interface GetMyProfileRequest extends Request {
  user: JwtTokenPayload;
}

export interface UpdateProfileRequest extends Request {
  user: JwtTokenPayload;
  body: UpdateProfileData;
}

export interface UploadAvatarRequest extends Request {
  user: JwtTokenPayload;
  file?: Express.Multer.File;
}

export interface GetPublicProfileRequest extends Request {
  params: { id: string };
}
