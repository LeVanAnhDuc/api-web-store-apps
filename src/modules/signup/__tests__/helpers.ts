/**
 * Shared test helpers for Signup module tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Schema } from "mongoose";

// =============================================================================
// Mock Request Creators
// =============================================================================

/**
 * Create a mock Express request object for SendOtp tests
 */
export const createSendOtpRequest = (email: string, language = "en"): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body: { email },
    t: mockT,
    language
  };
};

/**
 * Create a mock Express request object for VerifyOtp tests
 */
export const createVerifyOtpRequest = (
  email: string,
  otp: string,
  language = "en"
): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body: { email, otp },
    t: mockT,
    language
  };
};

/**
 * Create a mock Express request object for CompleteSignup tests
 */
export const createCompleteSignupRequest = (
  data: {
    email: string;
    password: string;
    fullName: string;
    gender: "male" | "female" | "other";
    dateOfBirth: string;
    sessionToken: string;
  },
  language = "en"
): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body: data,
    t: mockT,
    language
  };
};

/**
 * Create a mock Express request object for ResendOtp tests
 */
export const createResendOtpRequest = (email: string, language = "en"): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body: { email },
    t: mockT,
    language
  };
};

// =============================================================================
// Mock Data
// =============================================================================

/**
 * Mock OTP data
 */
export const mockOtp = "123456";

/**
 * Mock session token
 */
export const mockSessionToken =
  "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678";

/**
 * Mock auth record from database
 */
export const mockAuthRecord = {
  _id: {
    toString: () => "auth-id-123"
  } as unknown as Schema.Types.ObjectId,
  email: "test@example.com",
  password: "hashed-password",
  roles: "user"
};

/**
 * Mock user profile from database
 */
export const mockUserProfile = {
  _id: {
    toString: () => "user-id-456"
  } as unknown as Schema.Types.ObjectId,
  authId: mockAuthRecord._id,
  fullName: "Test User",
  gender: "male",
  dateOfBirth: new Date("1990-01-01")
};

/**
 * Mock JWT tokens
 */
export const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  idToken: "mock-id-token"
};

// =============================================================================
// Test Constants
// =============================================================================

export const TEST_EMAIL = "test@example.com";
export const TEST_PASSWORD = "SecureP@ss123";
export const TEST_FULL_NAME = "Test User";
export const TEST_GENDER = "male" as const;
export const TEST_DATE_OF_BIRTH = "1990-01-01";

/**
 * Invalid test data for edge cases
 */
export const INVALID_EMAILS = [
  "",
  "invalid-email",
  "no@domain",
  "@nodomain.com",
  "spaces in@email.com",
  "a".repeat(256) + "@test.com" // Too long
];

export const INVALID_OTPS = [
  "",
  "12345", // Too short
  "1234567", // Too long
  "abcdef", // Not numeric
  "12345a" // Contains letter
];

export const INVALID_PASSWORDS = [
  "",
  "short", // Too short
  "nouppercase123!", // No uppercase
  "NOLOWERCASE123!", // No lowercase
  "NoNumbers!", // No numbers
  "NoSpecial123" // No special characters
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a valid signup request with default test data
 */
export const createValidSignupData = (
  overrides: Partial<{
    email: string;
    password: string;
    fullName: string;
    gender: "male" | "female" | "other";
    dateOfBirth: string;
    sessionToken: string;
  }> = {}
) => ({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  fullName: TEST_FULL_NAME,
  gender: TEST_GENDER,
  dateOfBirth: TEST_DATE_OF_BIRTH,
  sessionToken: mockSessionToken,
  ...overrides
});
