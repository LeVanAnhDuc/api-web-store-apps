/**
 * Unit tests for CompleteSignup Service
 *
 * Test Categories:
 * 1. Happy Case: User account created successfully
 * 2. Failure Cases: Invalid session, Email already registered
 * 3. Edge Cases: Token generation, Profile data handling
 */

import { completeSignup } from "../service/complete-signup.service";
import * as repository from "../repository";
import * as signupStore from "../utils/store";
import * as bcryptHelper from "@/app/utils/crypto/bcrypt";
import * as jwtHelper from "@/app/services/auth/jwt.service";
import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";
import {
  createCompleteSignupRequest,
  createValidSignupData,
  mockAuthRecord,
  mockUserProfile,
  mockTokens,
  mockSessionToken,
  TEST_EMAIL
} from "./helpers";

jest.mock("../repository");
jest.mock("../utils/store");
jest.mock("@/app/utils/crypto/bcrypt");
jest.mock("@/app/services/auth/jwt.service");
jest.mock("@/infra/utils/logger");

const mockRepository = repository as jest.Mocked<typeof repository>;
const mockStore = signupStore as jest.Mocked<typeof signupStore>;
const mockBcrypt = bcryptHelper as jest.Mocked<typeof bcryptHelper>;
const mockJwt = jwtHelper as jest.Mocked<typeof jwtHelper>;

describe("CompleteSignup Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations for happy path
    mockStore.verifySession.mockResolvedValue(true);
    mockRepository.isEmailRegistered.mockResolvedValue(false);
    mockBcrypt.hashPassword.mockReturnValue("hashed-password");
    mockRepository.createAuthRecord.mockResolvedValue(mockAuthRecord);
    mockRepository.createUserProfile.mockResolvedValue(mockUserProfile);
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
    mockRepository.storeRefreshToken.mockResolvedValue(undefined);
    mockStore.cleanupSignupSession.mockResolvedValue(undefined);
  });

  // Happy Case Tests
  describe("Happy Case - Account Created Successfully", () => {
    it("should return success response with user data and tokens", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      const result = await completeSignup(req);

      expect(result.message).toBe("signup:success.signupCompleted");
      expect(result.data).toEqual({
        success: true,
        user: {
          id: expect.any(String),
          email: TEST_EMAIL,
          fullName: "Test User"
        },
        tokens: {
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          expiresIn: expect.any(Number)
        }
      });
    });

    it("should verify session token before processing", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockStore.verifySession).toHaveBeenCalledWith(
        TEST_EMAIL,
        mockSessionToken
      );
    });

    it("should double-check email is not registered", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockRepository.isEmailRegistered).toHaveBeenCalledWith(TEST_EMAIL);
    });

    it("should hash password before storing", async () => {
      const signupData = createValidSignupData();
      const req = createCompleteSignupRequest(signupData);

      await completeSignup(req);

      expect(mockBcrypt.hashPassword).toHaveBeenCalledWith(signupData.password);
    });

    it("should create auth record with hashed password", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockRepository.createAuthRecord).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        hashedPassword: "hashed-password"
      });
    });

    it("should create user profile with correct data", async () => {
      const signupData = createValidSignupData();
      const req = createCompleteSignupRequest(signupData);

      await completeSignup(req);

      expect(mockRepository.createUserProfile).toHaveBeenCalledWith({
        authId: mockAuthRecord._id,
        fullName: signupData.fullName,
        gender: signupData.gender,
        dateOfBirth: expect.any(Date)
      });
    });

    it("should generate JWT tokens with correct payload", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockJwt.generatePairToken).toHaveBeenCalledWith({
        userId: mockUserProfile._id.toString(),
        authId: mockAuthRecord._id.toString(),
        email: mockAuthRecord.email,
        roles: "user"
      });
    });

    it("should store refresh token in database", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockRepository.storeRefreshToken).toHaveBeenCalledWith(
        mockAuthRecord._id,
        mockTokens.refreshToken
      );
    });

    it("should cleanup signup session after completion", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockStore.cleanupSignupSession).toHaveBeenCalledWith(TEST_EMAIL);
    });
  });

  // Failure Case Tests
  describe("Failure Cases", () => {
    describe("Invalid Session Token", () => {
      it("should throw BadRequestError when session is invalid", async () => {
        mockStore.verifySession.mockResolvedValue(false);
        const req = createCompleteSignupRequest(createValidSignupData());

        await expect(completeSignup(req)).rejects.toThrow(BadRequestError);
        expect(req.t).toHaveBeenCalledWith("signup:errors.invalidSession");
      });

      it("should not check email registration when session is invalid", async () => {
        mockStore.verifySession.mockResolvedValue(false);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockRepository.isEmailRegistered).not.toHaveBeenCalled();
      });

      it("should not create auth record when session is invalid", async () => {
        mockStore.verifySession.mockResolvedValue(false);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockRepository.createAuthRecord).not.toHaveBeenCalled();
      });

      it("should not hash password when session is invalid", async () => {
        mockStore.verifySession.mockResolvedValue(false);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockBcrypt.hashPassword).not.toHaveBeenCalled();
      });
    });

    describe("Email Already Registered (Race Condition)", () => {
      it("should throw ConflictRequestError when email registered during flow", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createCompleteSignupRequest(createValidSignupData());

        await expect(completeSignup(req)).rejects.toThrow(ConflictRequestError);
        expect(req.t).toHaveBeenCalledWith("signup:errors.emailAlreadyExists");
      });

      it("should not create auth record when email already exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockRepository.createAuthRecord).not.toHaveBeenCalled();
      });

      it("should not create user profile when email already exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockRepository.createUserProfile).not.toHaveBeenCalled();
      });

      it("should not generate tokens when email already exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createCompleteSignupRequest(createValidSignupData());

        try {
          await completeSignup(req);
        } catch {
          // Expected error
        }

        expect(mockJwt.generatePairToken).not.toHaveBeenCalled();
      });
    });
  });

  // Edge Case Tests
  describe("Edge Cases", () => {
    it("should handle different gender values", async () => {
      const genders: Array<"male" | "female" | "other"> = [
        "male",
        "female",
        "other"
      ];

      for (const gender of genders) {
        jest.clearAllMocks();
        mockStore.verifySession.mockResolvedValue(true);
        mockRepository.isEmailRegistered.mockResolvedValue(false);
        mockBcrypt.hashPassword.mockReturnValue("hashed-password");
        mockRepository.createAuthRecord.mockResolvedValue(mockAuthRecord);
        mockRepository.createUserProfile.mockResolvedValue(mockUserProfile);
        mockJwt.generatePairToken.mockReturnValue(mockTokens);

        const req = createCompleteSignupRequest(
          createValidSignupData({ gender })
        );
        await completeSignup(req);

        expect(mockRepository.createUserProfile).toHaveBeenCalledWith(
          expect.objectContaining({ gender })
        );
      }
    });

    it("should correctly parse date of birth", async () => {
      const signupData = createValidSignupData({
        dateOfBirth: "1995-06-15"
      });
      const req = createCompleteSignupRequest(signupData);

      await completeSignup(req);

      expect(mockRepository.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfBirth: expect.any(Date)
        })
      );

      const callArgs = mockRepository.createUserProfile.mock.calls[0][0];
      const passedDate = callArgs.dateOfBirth as Date;
      expect(passedDate.getFullYear()).toBe(1995);
      expect(passedDate.getMonth()).toBe(5); // June (0-indexed)
      expect(passedDate.getDate()).toBe(15);
    });

    it("should handle full name with special characters", async () => {
      const specialNames = [
        "Jean-Pierre Dupont",
        "María José García",
        "O'Connor James",
        "Nguyễn Văn An"
      ];

      for (const fullName of specialNames) {
        jest.clearAllMocks();
        mockStore.verifySession.mockResolvedValue(true);
        mockRepository.isEmailRegistered.mockResolvedValue(false);
        mockBcrypt.hashPassword.mockReturnValue("hashed-password");
        mockRepository.createAuthRecord.mockResolvedValue(mockAuthRecord);
        mockRepository.createUserProfile.mockResolvedValue({
          ...mockUserProfile,
          fullName
        });
        mockJwt.generatePairToken.mockReturnValue(mockTokens);

        const req = createCompleteSignupRequest(
          createValidSignupData({ fullName })
        );
        const result = await completeSignup(req);

        expect(mockRepository.createUserProfile).toHaveBeenCalledWith(
          expect.objectContaining({ fullName })
        );
        expect(result.data?.user?.fullName).toBe(fullName);
      }
    });

    it("should call operations in correct order", async () => {
      const callOrder: string[] = [];

      mockStore.verifySession.mockImplementation(async () => {
        callOrder.push("verifySession");
        return true;
      });

      mockRepository.isEmailRegistered.mockImplementation(async () => {
        callOrder.push("checkEmail");
        return false;
      });

      mockBcrypt.hashPassword.mockImplementation(() => {
        callOrder.push("hashPassword");
        return "hashed-password";
      });

      mockRepository.createAuthRecord.mockImplementation(async () => {
        callOrder.push("createAuth");
        return mockAuthRecord;
      });

      mockRepository.createUserProfile.mockImplementation(async () => {
        callOrder.push("createProfile");
        return mockUserProfile;
      });

      mockJwt.generatePairToken.mockImplementation(() => {
        callOrder.push("generateTokens");
        return mockTokens;
      });

      mockRepository.storeRefreshToken.mockImplementation(async () => {
        callOrder.push("storeToken");
      });

      mockStore.cleanupSignupSession.mockImplementation(async () => {
        callOrder.push("cleanup");
      });

      const req = createCompleteSignupRequest(createValidSignupData());
      await completeSignup(req);

      expect(callOrder).toEqual([
        "verifySession",
        "checkEmail",
        "hashPassword",
        "createAuth",
        "createProfile",
        "generateTokens",
        "storeToken",
        "cleanup"
      ]);
    });

    it("should handle expired session token", async () => {
      mockStore.verifySession.mockResolvedValue(false);
      const req = createCompleteSignupRequest(createValidSignupData());

      await expect(completeSignup(req)).rejects.toThrow(BadRequestError);
    });

    it("should return correct user ID in response", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      const result = await completeSignup(req);

      expect(result.data?.user?.id).toBe(mockUserProfile._id.toString());
    });
  });

  // Security Tests
  describe("Security - Session Token Handling", () => {
    it("should verify session is single-use (deleted after completion)", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      // cleanupSignupSession should delete the session
      expect(mockStore.cleanupSignupSession).toHaveBeenCalledWith(TEST_EMAIL);
    });

    it("should not expose hashed password in response", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      const result = await completeSignup(req);

      // Response should not contain password
      expect(result.data).not.toHaveProperty("password");
      expect(result.data?.user).not.toHaveProperty("password");
    });

    it("should store refresh token securely", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      // storeRefreshToken should be called with auth ID, not user ID
      expect(mockRepository.storeRefreshToken).toHaveBeenCalledWith(
        mockAuthRecord._id,
        mockTokens.refreshToken
      );
    });

    it("should generate tokens with user role by default", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      expect(mockJwt.generatePairToken).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: "user" // Not admin
        })
      );
    });
  });

  // Idempotency Tests
  describe("Idempotency - Session Token Single-Use", () => {
    it("should reject request if session already used", async () => {
      // First call succeeds
      mockStore.verifySession.mockResolvedValue(true);
      const req1 = createCompleteSignupRequest(createValidSignupData());
      await completeSignup(req1);

      // Second call fails (session already consumed)
      mockStore.verifySession.mockResolvedValue(false);
      const req2 = createCompleteSignupRequest(createValidSignupData());

      await expect(completeSignup(req2)).rejects.toThrow(BadRequestError);
    });

    it("should cleanup session data on successful completion", async () => {
      const req = createCompleteSignupRequest(createValidSignupData());

      await completeSignup(req);

      // cleanupSignupSession cleans up: OTP, session, failed attempts, cooldown, resend count
      expect(mockStore.cleanupSignupSession).toHaveBeenCalledTimes(1);
    });
  });
});
