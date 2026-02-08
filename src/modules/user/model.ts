import { Schema, model, type Model } from "mongoose";
import type { UserDocument } from "@/modules/user/types";
import {
  GENDERS,
  FULLNAME_VALIDATION,
  SAFE_FULLNAME_PATTERN,
  SAFE_ADDRESS_PATTERN
} from "@/modules/user/constants";
import { MODEL_NAMES } from "@/app/constants/models";

const { USER, AUTHENTICATION } = MODEL_NAMES;

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
      minlength: [
        FULLNAME_VALIDATION.MIN_LENGTH,
        `Full name must be at least ${FULLNAME_VALIDATION.MIN_LENGTH} characters`
      ],
      maxlength: [
        FULLNAME_VALIDATION.MAX_LENGTH,
        `Full name must not exceed ${FULLNAME_VALIDATION.MAX_LENGTH} characters`
      ],
      match: [
        SAFE_FULLNAME_PATTERN,
        "Full name can only contain letters, spaces, hyphens, apostrophes, and periods"
      ]
    },
    phone: {
      type: String,
      required: false,
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
      maxlength: [500, "Address must not exceed 500 characters"],
      match: [SAFE_ADDRESS_PATTERN, "Address contains invalid characters"]
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

UserSchema.index({ authId: 1 });
UserSchema.index({ phone: 1 });

UserSchema.virtual("auth", {
  ref: AUTHENTICATION,
  localField: "authId",
  foreignField: "_id",
  justOne: true
});

const UserModel: Model<UserDocument> = model<UserDocument>(USER, UserSchema);

export default UserModel;
