// libs
import { Schema, model } from "mongoose";
// types
import { type IUserDocument, EGender } from "@/types/modules/user";
// others
import CONSTANTS from "@/constants";

const { AUTHENTICATION, USER } = CONSTANTS.MODEL_NAME;

const UserSchema = new Schema<IUserDocument>(
  {
    authId: {
      type: Schema.Types.ObjectId,
      ref: AUTHENTICATION,
      required: true,
      unique: true
    },
    userName: { type: String, default: null },
    fullName: { type: String, default: null },
    phone: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: Object.values(EGender), default: null },
    avatar: { type: String, default: null },
    address: { type: String, default: null }
  },
  {
    collection: "users",
    timestamps: true
  }
);

const User = model<IUserDocument>(USER, UserSchema);

export default User;
