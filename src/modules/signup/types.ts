import type { Request } from "express";
import type { Gender } from "@/modules/user/types";
import type { AuthTokensResponse } from "@/types/auth";

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

export interface SendOtpResponse {
  success: true;
  expiresIn: number;
  cooldownSeconds: number;
}

export interface VerifyOtpResponse {
  success: true;
  sessionToken: string;
  expiresIn: number;
}

export interface VerifyOtpErrorData {
  remainingAttempts: number;
}

export interface ResendOtpResponse {
  success: true;
  expiresIn: number;
  cooldownSeconds: number;
  resendCount: number;
  maxResends: number;
  remainingResends: number;
}

export interface CompleteSignupResponse {
  success: true;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  tokens: AuthTokensResponse;
}

export interface CheckEmailResponse {
  available: boolean;
}

export interface SendOtpRequest extends Request {
  body: SendOtpBody;
}

export interface VerifyOtpRequest extends Request {
  body: VerifyOtpBody;
}

export interface ResendOtpRequest extends Request {
  body: ResendOtpBody;
}

export interface CompleteSignupRequest extends Request {
  body: CompleteSignupBody;
}

export interface CheckEmailRequest extends Request {
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
