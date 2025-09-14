// libs
import mongoose, { Document } from 'mongoose';
// types
import { IUser, IUserSpecifically } from '../types/users';
// others
import CONSTANTS from '../constants';

const { EGender, ERole } = CONSTANTS;

const { Schema } = mongoose;

export interface IUserDocument extends IUser, Document {}

export const IUserSpecificallySchema = new Schema<IUserSpecifically>(
  {
    userName: { type: String, trim: true },
    fullName: { type: String, default: null },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: null }
  },
  {
    _id: false
  }
);

const UserSchema = new Schema<IUser>(
  {
    userName: { type: String, default: null },
    fullName: { type: String, default: null },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      required: true
    },
    password: { type: String, trim: true, required: true },
    isActive: { type: Boolean, default: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: Object.values(EGender), default: null },
    avatar: { type: String, default: null },
    address: { type: String, default: null },
    role: { type: String, enum: Object.values(ERole), default: ERole.USER },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    verifiedEmail: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpireAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null }
  },
  {
    collection: 'users',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
