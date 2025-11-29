/**
 * Unit tests for Login Service - Invalid Credentials Scenarios
 */

import { login } from "../service";
import AuthModel from "@/modules/auth/model";
import * as bcryptHelper from "@/core/helpers/bcrypt";
import * as jwtHelper from "@/core/helpers/jwt";
import * as loginStore from "../utils/store";
import { UnauthorizedError } from "@/core/responses/error";
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

describe("Login Service - Invalid Credentials", () => {
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
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
  });

  describe("User không tồn tại", () => {
    it("should throw UnauthorizedError khi email không tồn tại", async () => {
      const req = createMockRequest("notfound@example.com", "password");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(login(req)).rejects.toThrow(UnauthorizedError);
      expect(req.t).toHaveBeenCalledWith("login:errors.invalidCredentials");
    });

    it("should không increment failed attempts khi user không tồn tại", async () => {
      const req = createMockRequest("notfound@example.com", "password");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(null);

      try {
        await login(req);
      } catch {
        // Expected
      }

      expect(mockStore.incrementFailedLoginAttempts).not.toHaveBeenCalled();
    });
  });

  describe("Password sai", () => {
    it("should throw UnauthorizedError khi password sai", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);

      await expect(login(req)).rejects.toThrow(UnauthorizedError);
    });

    it("should increment failed attempts khi password sai", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);

      try {
        await login(req);
      } catch {
        // Expected
      }

      expect(mockStore.incrementFailedLoginAttempts).toHaveBeenCalledWith(
        "test@example.com"
      );
    });

    it("should không reset failed attempts khi password sai", async () => {
      const req = createMockRequest("test@example.com", "wrongPassword");
      mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
      mockBcrypt.isValidPassword.mockReturnValue(false);

      try {
        await login(req);
      } catch {
        // Expected
      }

      expect(mockStore.resetFailedLoginAttempts).not.toHaveBeenCalled();
    });
  });
});
