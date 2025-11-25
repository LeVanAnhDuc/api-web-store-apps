import type { GENDERS } from "@/shared/constants/modules/user";
import type { Request } from "express";

export interface SendOtpResponse {
  success: true;
  expiresIn: number;
}

export interface VerifyOtpResponse {
  success: true;
  sessionId: string;
  expiresIn: number;
}

export interface CompleteSignupResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  };
}

export interface SendOtpBody {
  email: string;
}

export interface VerifyOtpBody {
  email: string;
  otp: string;
}

export interface CompleteSignupBody {
  email: string;
  password: string;
  sessionId: string;
  acceptTerms: boolean;
  fullName: string;
  gender: typeof GENDERS;
  birthday: string | Date;
}

export type SendOtpRequest = Request<
  Record<string, never>,
  unknown,
  SendOtpBody
>;
export type VerifyOtpRequest = Request<
  Record<string, never>,
  unknown,
  VerifyOtpBody
>;
export type CompleteSignupRequest = Request<
  Record<string, never>,
  unknown,
  CompleteSignupBody
>;
