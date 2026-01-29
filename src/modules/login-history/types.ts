import type { Schema, Document } from "mongoose";
import type { LoginMethod } from "@/modules/login/types";
import type {
  LOGIN_STATUSES,
  LOGIN_FAIL_REASONS
} from "@/modules/login/constants";

export type LoginStatus = (typeof LOGIN_STATUSES)[keyof typeof LOGIN_STATUSES];

export type LoginFailReason =
  (typeof LOGIN_FAIL_REASONS)[keyof typeof LOGIN_FAIL_REASONS];

export interface LoginHistoryDocument extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
  createdAt: Date;
}
