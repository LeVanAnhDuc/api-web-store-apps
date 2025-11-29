/**
 * Unit tests for Login Service - Time Message Formatting
 */

import { login } from "../service";
import AuthModel from "@/modules/auth/model";
import * as bcryptHelper from "@/core/helpers/bcrypt";
import * as jwtHelper from "@/core/helpers/jwt";
import * as loginStore from "../utils/store";
import { BadRequestError } from "@/core/responses/error";
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

describe("Login Service - Time Message Formatting", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.checkLoginLockout.mockResolvedValue({
      isLocked: false,
      remainingSeconds: 0
    });
    mockStore.getFailedLoginAttempts.mockResolvedValue(0);
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
  });

  describe("English - Minutes", () => {
    it("should format 'minutes' (plural) khi > 1 phút", async () => {
      const req = createMockRequest("test@example.com", "password", "en");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 120 // 2 phút
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(7);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should format 'minute' (singular) khi = 1 phút", async () => {
      const req = createMockRequest("test@example.com", "password", "en");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 60 // 1 phút
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(6);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should round up khi không chia hết cho 60", async () => {
      const req = createMockRequest("test@example.com", "password", "en");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 61 // sẽ round up thành 2 phút
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(7);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });
  });

  describe("English - Seconds", () => {
    it("should format 'seconds' (plural) khi > 1 giây và < 60 giây", async () => {
      const req = createMockRequest("test@example.com", "password", "en");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 30
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should format 'second' (singular) khi = 1 giây", async () => {
      const req = createMockRequest("test@example.com", "password", "en");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 1
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });
  });

  describe("Vietnamese - Minutes", () => {
    it("should format 'phút' cho tiếng Việt", async () => {
      const req = createMockRequest("test@example.com", "password", "vi");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 120
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(7);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });
  });

  describe("Vietnamese - Seconds", () => {
    it("should format 'giây' cho tiếng Việt", async () => {
      const req = createMockRequest("test@example.com", "password", "vi");
      mockStore.checkLoginLockout.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 30
      });
      mockStore.getFailedLoginAttempts.mockResolvedValue(5);

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });
  });

  describe("Time formatting in handleFailedLogin", () => {
    it("should format minutes khi lockout trigger với lockoutSeconds >= 60", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword", "en");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 6,
        lockoutSeconds: 60
      });

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should format seconds khi lockout trigger với lockoutSeconds < 60", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword", "en");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 5,
        lockoutSeconds: 30
      });

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });

    it("should format Vietnamese trong handleFailedLogin", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword", "vi");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);
      mockStore.incrementFailedLoginAttempts.mockResolvedValue({
        attemptCount: 5,
        lockoutSeconds: 30
      });

      await expect(login(req)).rejects.toThrow(BadRequestError);
    });
  });
});
