/**
 * Shared test helpers for Signup module tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create a mock Express request object for signup tests
 */
export const createMockRequest = (body: any, language = "en"): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body,
    t: mockT,
    language
  };
};

/**
 * Valid complete signup body for tests
 */
export const validSignupBody = {
  email: "test@example.com",
  password: "password123",
  confirmPassword: "password123",
  fullName: "Test User",
  gender: "male",
  dateOfBirth: "1990-01-01",
  sessionToken: "session-token-123",
  acceptTerms: true
};

/**
 * Mock auth user data
 */
export const mockAuthData = {
  _id: { toString: () => "auth-id-123" },
  email: "test@example.com",
  roles: "user"
};

/**
 * Mock user data
 */
export const mockUserData = {
  _id: { toString: () => "user-id-123" },
  fullName: "Test User"
};

/**
 * Mock JWT tokens
 */
export const mockTokens = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  idToken: "id-token"
};
