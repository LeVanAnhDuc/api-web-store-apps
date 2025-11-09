// libs
import type { Schema } from "mongoose";
// constants
import type { GENDERS } from "@/shared/constants/database/user.constants";

/**
 * Gender type derived from GENDERS constant
 */
export type TGender = (typeof GENDERS)[keyof typeof GENDERS];

/**
 * User document interface
 */
export interface IUserDocument {
  _id: Schema.Types.ObjectId;
  authId: Schema.Types.ObjectId;
  fullName: string;
  phone: string;
  avatar?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: TGender;
  createdAt: Date;
  updatedAt: Date;
}
