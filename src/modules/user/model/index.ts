// libs
import { Schema, model, type Model } from "mongoose";
// types
import type { UserDocument } from "@/shared/types/modules/user";
// constants
import { GENDERS } from "@/shared/constants/database/user.constants";
import CONSTANTS from "@/shared/constants";

const { USER, AUTHENTICATION } = CONSTANTS.MODEL_NAME;

/**
 * User schema for profile data
 */
const UserSchema = new Schema<UserDocument>(
  {
    authId: {
      type: Schema.Types.ObjectId,
      ref: AUTHENTICATION,
      required: [true, "Auth ID is required"],
      unique: true
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name must not exceed 100 characters"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\d\s()+-]+$/, "Please provide a valid phone number"]
    },
    avatar: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address must not exceed 500 characters"]
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: Object.values(GENDERS)
    }
  },
  {
    collection: "users",
    timestamps: true
  }
);

/**
 * Indexes for better query performance
 */
UserSchema.index({ authId: 1 });
UserSchema.index({ phone: 1 });

/**
 * Virtual populate for auth
 */
UserSchema.virtual("auth", {
  ref: AUTHENTICATION,
  localField: "authId",
  foreignField: "_id",
  justOne: true
});

const UserModel: Model<UserDocument> = model<UserDocument>(USER, UserSchema);

export default UserModel;
