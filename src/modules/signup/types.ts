/**
 * Signup Module Types
 * Type definitions for signup flow request/response DTOs
 * Based on System Design v1.1 specifications
 */

import type { Request } from "express";
import type { Gender } from "@/modules/user/types";

/**
 * Send OTP request body
 * Step 1: User submits email to receive OTP
 */
export interface SendOtpBody {
  email: string;
}

/**
 * Verify OTP request body
 * Step 2: User submits OTP for verification
 */
export interface VerifyOtpBody {
  email: string;
  otp: string;
}

/**
 * Resend OTP request body
 * Alternative Step 2: User requests new OTP
 */
export interface ResendOtpBody {
  email: string;
}

/**
 * Complete signup request body
 * Step 3: User submits profile data to complete registration
 */
export interface CompleteSignupBody {
  email: string;
  sessionToken: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Check email availability request params
 * Optional UX enhancement for real-time email validation
 */
export interface CheckEmailParams {
  email: string;
  [key: string]: string; // Index signature for Express ParamsDictionary
}

/**
 * Send OTP success response data
 */
export interface SendOtpResponse {
  success: true;
  expiresIn: number; // seconds
  cooldownSeconds: number;
}

/**
 * Verify OTP success response data
 */
export interface VerifyOtpResponse {
  success: true;
  sessionToken: string;
  expiresIn: number;
}

/**
 * Verify OTP error response data (when OTP is invalid)
 */
export interface VerifyOtpErrorData {
  remainingAttempts: number;
}

/**
 * Resend OTP success response data
 */
export interface ResendOtpResponse {
  success: true;
  expiresIn: number;
  cooldownSeconds: number;
  resendCount: number;
  maxResends: number;
  remainingResends: number;
}

/**
 * Complete signup success response data
 */
export interface CompleteSignupResponse {
  success: true;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  };
}

/**
 * Check email availability response data
 */
export interface CheckEmailResponse {
  available: boolean;
}

/**
 * Express Request with SendOtpBody
 */
export interface SendOtpRequest extends Request {
  body: SendOtpBody;
}

/**
 * Express Request with VerifyOtpBody
 */
export interface VerifyOtpRequest extends Request {
  body: VerifyOtpBody;
}

/**
 * Express Request with ResendOtpBody
 */
export interface ResendOtpRequest extends Request {
  body: ResendOtpBody;
}

/**
 * Express Request with CompleteSignupBody
 */
export interface CompleteSignupRequest extends Request {
  body: CompleteSignupBody;
}

/**
 * Express Request with CheckEmailParams
 */
export interface CheckEmailRequest extends Request {
  params: CheckEmailParams;
}

/**
 * OTP data stored in Redis
 */
export interface OtpData {
  hashedOtp: string;
  expiresAt: number; // Unix timestamp
  failedAttempts: number;
  resendCount: number;
}

/**
 * Signup session data stored in Redis
 */
export interface SignupSession {
  email: string;
  verified: boolean;
  sessionToken: string;
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

/**
 * User profile data for account creation (Step 3)
 */
export interface UserProfileData {
  email: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  password: string;
}

/**
 * Internal service return types
 */
export interface OtpVerificationResult {
  verified: boolean;
  remainingAttempts?: number;
}

export interface SessionCreationResult {
  sessionToken: string;
  expiresIn: number;
}
