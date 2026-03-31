// types
import type { Request } from "express";
import type { Gender } from "@/types/modules/user";

export interface SendOtpBody {
  email: string;
}

export interface VerifyOtpBody {
  email: string;
  otp: string;
}

export interface ResendOtpBody {
  email: string;
}

export interface CompleteSignupBody {
  email: string;
  sessionToken: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface CheckEmailParams {
  email: string;
  [key: string]: string;
}

export interface SendOtpRequest extends Omit<Request, "body"> {
  body: SendOtpBody;
}

export interface VerifyOtpRequest extends Omit<Request, "body"> {
  body: VerifyOtpBody;
}

export interface ResendOtpRequest extends Omit<Request, "body"> {
  body: ResendOtpBody;
}

export interface CompleteSignupRequest extends Omit<Request, "body"> {
  body: CompleteSignupBody;
}

export interface CheckEmailRequest extends Omit<Request, "params"> {
  params: CheckEmailParams;
}

export interface OtpData {
  hashedOtp: string;
  expiresAt: number;
  failedAttempts: number;
  resendCount: number;
}

export interface SignupSession {
  email: string;
  verified: boolean;
  sessionToken: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserProfileData {
  email: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  password: string;
}

export interface OtpVerificationResult {
  verified: boolean;
  remainingAttempts?: number;
}

export interface SessionCreationResult {
  sessionToken: string;
  expiresIn: number;
}
