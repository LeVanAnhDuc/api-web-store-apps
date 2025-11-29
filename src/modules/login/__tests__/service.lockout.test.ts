/**
 * Unit tests for Login Service - Account Lockout Scenarios
 */

import { login } from "../service";
import AuthModel from "@/modules/auth/model";
import * as bcryptHelper from "@/core/helpers/bcrypt";
import * as jwtHelper from "@/core/helpers/jwt";
import * as loginStore from "../utils/store";
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";
import { createMockRequest, mockAuthUser, mockTokens } from "./helpers";

// Mock dependencies
jest.mock("@/modules/auth/model");
jest.mock("@/core/helpers/bcrypt");
jest.mock("@/core/helpers/jwt");
jest.mock("../utils/store");

const mockAuthModel = AuthModel as jest.Mocked<typeof AuthModel>;
const mockBcrypt = bcryptHelper as jest.Mocked<typeof bcryptHelper>;
const mockJwt = jwtHelper as jest.Mocked<typeof jwtHelper>;
const mockStore = loginStore as jest.Mocked<typeof loginStore>;

describe("Login Service - Account Lockout", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.checkLoginLockout.mockResolvedValue({
      isLocked: false,
      remainingSeconds: 0
    });
    mockStore.incrementFailedLoginAttempts.mockResolvedValue({
      attemptCount: 1,
      lockoutSeconds: 0
    });
    mockStore.getFailedLoginAttempts.mockResolvedValue(0);
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
  });

  describe("Tài khoản đã bị khóa", () => {
    it("should throw BadRequestError khi tài khoản đang bị lock", async () => {
      const req = createMockRequest("test@example.com", "password");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 300
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should không tìm user khi tài khoản đang bị lock", async () => {
      const req = createMockRequest("test@example.com", "password");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 300
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      try {
        await login(req);
      } catch {
        // Expected
      }

      expect(mockAuthModel.findOne).not.toHaveBeenCalled();
    });

    it("should không verify password khi tài khoản đang bị lock", async () => {
      const req = createMockRequest("test@example.com", "password");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 300
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      try {
        await login(req);
      } catch {
        // Expected
      }

      expect(mockBcrypt.isValidPassword).not.toHaveBeenCalled();
    });
  });

  describe("Lockout được trigger sau khi vượt quá số lần cho phép", () => {
    it("should throw BadRequestError sau lần thất bại thứ 5 với lockout", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 5,
        lockoutSeconds: 30
      });

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError sau lần thất bại thứ 10 với max lockout", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 10,
        lockoutSeconds: 1800
      });

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should throw UnauthorizedError (không phải BadRequestError) khi attempts < 5", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 4,
        lockoutSeconds: 0
      });

      await expect(login(req)).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError khi attempts >= 5 nhưng lockoutSeconds = 0", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 5,
        lockoutSeconds: 0
      });

      await expect(login(req)).rejects.toThrow(UnauthorizedError);
    });
  });
});
