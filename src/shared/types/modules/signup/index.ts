/**
 * Signup Module Types
 * Type definitions for signup flow request/response DTOs
 * Based on System Design v1.1 specifications
 */

// libs
import type { Request } from "express";
// types
import type { Gender } from "@/shared/types/modules/user";

// ============================================================================
// Request Body Types
// ============================================================================

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
}

// ============================================================================
// Response Data Types
// ============================================================================

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
 * Lockout error response data
 */
export interface LockoutErrorData {
  lockoutEndsAt: string; // ISO timestamp
  lockoutMinutes: number;
}

/**
 * Rate limit error response data
 */
export interface RateLimitErrorData {
  retryAfter: number; // seconds
}

// ============================================================================
// Express Request Types (with typed body)
// ============================================================================

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

export type ResendOtpRequest = Request<
  Record<string, never>,
  unknown,
  ResendOtpBody
>;

export type CompleteSignupRequest = Request<
  Record<string, never>,
  unknown,
  CompleteSignupBody
>;

export type CheckEmailRequest = Request<CheckEmailParams>;

// ============================================================================
// Session Types (for Redis storage)
// ============================================================================

/**
 * Signup session data stored in Redis
 * Used for tracking signup progress between steps
 */
export interface SignupSessionData {
  email: string;
  step: SignupStep;
  otpVerified: boolean;
  createdAt: number; // timestamp
}

/**
 * Signup flow steps
 */
export type SignupStep = 1 | 2 | 3;

/**
 * Signup step status constants
 */
export const SIGNUP_STEPS = {
  EMAIL_SUBMITTED: 1,
  OTP_VERIFIED: 2,
  PROFILE_COMPLETED: 3
} as const;
