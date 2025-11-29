/**
 * Unit tests for Login Service - Successful Login Scenarios
 */

import { login } from "../service";
import AuthModel from "@/modules/auth/model";
import * as bcryptHelper from "@/core/helpers/bcrypt";
import * as jwtHelper from "@/core/helpers/jwt";
import * as loginStore from "../utils/store";
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

describe("Login Service - Successful Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockStore.checkLoginLockout.mockResolvedValue({
      isLocked: false,
      remainingSeconds: 0
    });
    mockStore.resetFailedLoginAttempts.mockResolvedValue(undefined);
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
    mockAuthModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockAuthUser);
  });

  it("should return tokens khi credentials hợp lệ", async () => {
    const req = createMockRequest("test@example.com", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    const result = await login(req);

    expect(result.message).toBe("login:success.loginSuccessful");
    expect(result.data).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      idToken: "id-token",
      expiresIn: expect.any(Number)
    });
  });

  it("should reset failed attempts sau khi login thành công", async () => {
    const req = createMockRequest("test@example.com", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockStore.resetFailedLoginAttempts).toHaveBeenCalledWith(
      "test@example.com"
    );
  });

  it("should update lastLogin và refreshToken trong database", async () => {
    const req = createMockRequest("test@example.com", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockAuthModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockAuthUser._id,
      expect.objectContaining({
        refreshToken: "refresh-token",
        lastLogin: expect.any(Date)
      })
    );
  });

  it("should generate tokens với đúng payload", async () => {
    const req = createMockRequest("test@example.com", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockJwt.generatePairToken).toHaveBeenCalledWith({
      userId: "user-id-123",
      authId: "user-id-123",
      email: "test@example.com",
      roles: "user"
    });
  });

  it("should kiểm tra lockout trước khi tìm user", async () => {
    const req = createMockRequest("test@example.com", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockStore.checkLoginLockout).toHaveBeenCalledWith(
      "test@example.com"
    );
  });
});
