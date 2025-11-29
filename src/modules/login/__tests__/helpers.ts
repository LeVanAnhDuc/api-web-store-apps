/**
 * Shared test helpers for Login module tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create a mock Express request object for login tests
 */
export const createMockRequest = (
  email: string,
  password: string,
  language = "en"
): any => {
  const mockT = jest.fn((key: string) => key);
  return {
    body: { email, password },
    t: mockT,
    language
  };
};

/**
 * Mock auth user data
 */
export const mockAuthUser = {
  _id: { toString: () => "user-id-123" },
  email: "test@example.com",
  password: "hashed-password",
  roles: "user"
};

/**
 * Mock JWT tokens
 */
export const mockTokens = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  idToken: "id-token"
};
