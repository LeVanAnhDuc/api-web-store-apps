import type { Request } from "express";
import type { LOGIN_METHODS } from "@/constants/modules/login-history";
import type { Schema } from "mongoose";
import type {
  LoginFailReason,
  LoginStatus
} from "@/types/modules/login-history";

export type LoginMethod = (typeof LOGIN_METHODS)[keyof typeof LOGIN_METHODS];

export interface PasswordLoginBody {
  email: string;
  password: string;
}

export interface PasswordLoginRequest extends Omit<Request, "body"> {
  body: PasswordLoginBody;
}

export interface OtpSendBody {
  email: string;
}

export interface OtpVerifyBody {
  email: string;
  otp: string;
}

export interface OtpSendRequest extends Omit<Request, "body"> {
  body: OtpSendBody;
}

export interface OtpVerifyRequest extends Omit<Request, "body"> {
  body: OtpVerifyBody;
}

export interface MagicLinkSendBody {
  email: string;
}

export interface MagicLinkVerifyBody {
  email: string;
  token: string;
}

export interface MagicLinkSendRequest extends Omit<Request, "body"> {
  body: MagicLinkSendBody;
}

export interface MagicLinkVerifyRequest extends Omit<Request, "body"> {
  body: MagicLinkVerifyBody;
}

export interface CreateLoginHistoryInput {
  userId: Schema.Types.ObjectId | string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
}
