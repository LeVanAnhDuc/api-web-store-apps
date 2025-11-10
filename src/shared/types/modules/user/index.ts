// libs
import type { Schema } from "mongoose";
// constants
import type { GENDERS } from "@/shared/constants/user";

/**
 * Gender type derived from GENDERS constant
 */
export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  authId: Schema.Types.ObjectId;
  fullName: string;
  phone: string;
  avatar?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  createdAt: Date;
  updatedAt: Date;
}
