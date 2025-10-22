// types
import type { Document, Schema } from "mongoose";

export enum EGender {
  // eslint-disable-next-line no-unused-vars
  MALE = "MALE",
  // eslint-disable-next-line no-unused-vars
  FEMALE = "FEMALE",
  // eslint-disable-next-line no-unused-vars
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

export interface IUserDocument extends IUser, Document {
  _id: Schema.Types.ObjectId;
}

export interface IUserCreation {
  authId: IUser["authId"];
  phone: IUser["phone"];
  fullName: IUser["fullName"];
}
