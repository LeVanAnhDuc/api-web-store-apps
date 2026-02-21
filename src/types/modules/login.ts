import type { Request } from "express";
import type { AuthTokensResponse } from "@/types/auth";
import type { LOGIN_METHODS } from "@/constants/enums";
import type { Schema } from "mongoose";
import type {
  LoginFailReason,
  LoginStatus
} from "@/types/modules/login-history";

export type LoginMethod = (typeof LOGIN_METHODS)[keyof typeof LOGIN_METHODS];

export type LoginResponse = AuthTokensResponse;

export interface PasswordLoginBody {
  email: string;
  password: string;
}

export type PasswordLoginRequest = Request<
  Record<string, never>,
  unknown,
  PasswordLoginBody
>;

export interface OtpSendBody {
  email: string;
}

export interface OtpVerifyBody {
  email: string;
  otp: string;
}

export interface OtpSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type OtpSendRequest = Request<
  Record<string, never>,
  unknown,
  OtpSendBody
>;

export type OtpVerifyRequest = Request<
  Record<string, never>,
  unknown,
  OtpVerifyBody
>;

export interface MagicLinkSendBody {
  email: string;
}

export interface MagicLinkVerifyBody {
  email: string;
  token: string;
}

export interface MagicLinkSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type MagicLinkSendRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkSendBody
>;

export type MagicLinkVerifyRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkVerifyBody
>;

export interface CreateLoginHistoryInput {
  userId: Schema.Types.ObjectId | string;
  method: LoginMethod;
  status: LoginStatus;
  failReason?: LoginFailReason;
  ip: string;
}
