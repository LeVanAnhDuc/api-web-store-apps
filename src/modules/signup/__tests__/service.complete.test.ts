/**
 * Unit tests for Signup Service - Complete Signup
 */

import { completeSignup } from "../service";
import AuthModel from "@/modules/auth/model";
import UserModel from "@/modules/user/model";
import * as bcryptHelper from "@/core/helpers/bcrypt";
import * as jwtHelper from "@/core/helpers/jwt";
import * as signupStore from "../utils/store";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import {
  createMockRequest,
  validSignupBody,
  mockAuthData,
  mockUserData,
  mockTokens
} from "./helpers";

// Mock dependencies
jest.mock("@/modules/auth/model");
jest.mock("@/modules/user/model");
jest.mock("@/core/helpers/bcrypt");
jest.mock("@/core/helpers/jwt");
jest.mock("../utils/store");

const mockAuthModel = AuthModel as jest.Mocked<typeof AuthModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockBcrypt = bcryptHelper as jest.Mocked<typeof bcryptHelper>;
const mockJwt = jwtHelper as jest.Mocked<typeof jwtHelper>;
const mockStore = signupStore as jest.Mocked<typeof signupStore>;

describe("Signup Service - Complete Signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.verifySession.mockResolvedValue(true);
    mockStore.cleanupSignupSession.mockResolvedValue(undefined);

    mockAuthModel.findOne = jest.fn().mockResolvedValue(null);
    mockAuthModel.create = jest.fn().mockResolvedValue(mockAuthData);
    mockAuthModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    mockUserModel.create = jest.fn().mockResolvedValue(mockUserData);

    mockBcrypt.hashPassword.mockReturnValue("hashed-password");
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
  });

  describe("Successful signup", () => {
    it("should return success response với tokens", async () => {
      const req = createMockRequest(validSignupBody);

      const result = await completeSignup(req);

      expect(result.message).toBe("signup:success.signupCompleted");
      expect(result.data?.data).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        expiresIn: expect.any(Number)
      });
    });

    it("should verify session trước khi tạo user", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockStore.verifySession).toHaveBeenCalledWith(
        "test@example.com",
        "session-id-123"
      );
    });

    it("should hash password trước khi save", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockBcrypt.hashPassword).toHaveBeenCalledWith("password123");
    });

    it("should create Auth record", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockAuthModel.create).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "hashed-password",
        verifiedEmail: true,
        roles: "user"
      });
    });

    it("should create User record với profile info", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        authId: expect.anything(),
        fullName: "Test User",
        gender: "male",
        dateOfBirth: expect.any(Date)
      });
    });

    it("should generate JWT tokens", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockJwt.generatePairToken).toHaveBeenCalledWith({
        userId: "user-id-123",
        authId: "auth-id-123",
        email: "test@example.com",
        roles: "user"
      });
    });

    it("should update refreshToken trong Auth record", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockAuthModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { refreshToken: "refresh-token" }
      );
    });

    it("should cleanup signup session sau khi hoàn tất", async () => {
      const req = createMockRequest(validSignupBody);

      await completeSignup(req);

      expect(mockStore.cleanupSignupSession).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("Error handling", () => {
    it("should throw BadRequestError khi session không hợp lệ", async () => {
      mockStore.verifySession.mockResolvedValue(false);
      const req = createMockRequest(validSignupBody);

      await expect(completeSignup(req)).rejects.toThrow(BadRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.invalidSession");
    });

    it("should throw ConflictRequestError khi email đã tồn tại", async () => {
      mockAuthModel.findOne = jest.fn().mockResolvedValue({
        email: "test@example.com"
      });
      const req = createMockRequest(validSignupBody);

      await expect(completeSignup(req)).rejects.toThrow(ConflictRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.emailAlreadyExists");
    });

    it("should không create user khi session invalid", async () => {
      mockStore.verifySession.mockResolvedValue(false);
      const req = createMockRequest(validSignupBody);

      try {
        await completeSignup(req);
      } catch {
        // Expected
      }

      expect(mockAuthModel.create).not.toHaveBeenCalled();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle birthday edge case", async () => {
      const req = createMockRequest({
        ...validSignupBody,
        birthday: "2000-12-31"
      });

      await completeSignup(req);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfBirth: expect.any(Date)
        })
      );
    });

    it("should handle all gender values", async () => {
      const testGenders = ["male", "female", "other"];

      for (const gender of testGenders) {
        jest.clearAllMocks();
        mockStore.verifySession.mockResolvedValue(true);
        mockAuthModel.findOne = jest.fn().mockResolvedValue(null);
        mockAuthModel.create = jest.fn().mockResolvedValue(mockAuthData);
        mockUserModel.create = jest.fn().mockResolvedValue(mockUserData);
        mockJwt.generatePairToken.mockReturnValue(mockTokens);

        const req = createMockRequest({
          ...validSignupBody,
          gender
        });

        await completeSignup(req);

        expect(mockUserModel.create).toHaveBeenCalledWith(
          expect.objectContaining({ gender })
        );
      }
    });

    it("should handle Vietnamese language", async () => {
      const req = createMockRequest(validSignupBody, "vi");

      const result = await completeSignup(req);

      expect(result.data?.success).toBe(true);
    });
  });
});
