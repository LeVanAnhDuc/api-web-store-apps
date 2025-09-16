// types
import type { Document, Schema } from "mongoose";

export enum EGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export type TGender = `${EGender}`;

export interface IUser {
  authId: Schema.Types.ObjectId;
  userName: string;
  fullName: string;
  phone: string;
  dateOfBirth: Date;
  gender: TGender;
  avatar: string;
  address: string;
}

export interface IUserDocument extends IUser, Pick<Document, "_id"> {
  _id: Schema.Types.ObjectId;
}

export interface IUserCreation {
  authId: IUser["authId"];
  phone: IUser["phone"];
  fullName: IUser["fullName"];
}
