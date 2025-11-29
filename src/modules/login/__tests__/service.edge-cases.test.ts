/**
 * Unit tests for Login Service - Edge Cases
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

describe("Login Service - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.checkLoginLockout.mockResolvedValue({
      isLocked: false,
      remainingSeconds: 0
    });
    mockStore.resetFailedLoginAttempts.mockResolvedValue(undefined);
    mockStore.incrementFailedLoginAttempts.mockResolvedValue({
      attemptCount: 1,
      lockoutSeconds: 0
    });
    mockJwt.generatePairToken.mockReturnValue(mockTokens);
    mockAuthModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockAuthUser);
  });

  it("should xử lý email với uppercase (case-insensitive)", async () => {
    const req = createMockRequest("TEST@EXAMPLE.COM", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockAuthModel.findOne).toHaveBeenCalled();
  });

  it("should xử lý password với special characters", async () => {
    const req = createMockRequest("test@example.com", "P@ss!w0rd#$%^&*()");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(true);

    await login(req);

    expect(mockBcrypt.isValidPassword).toHaveBeenCalledWith(
      "P@ss!w0rd#$%^&*()",
      "hashed-password"
    );
  });

  it("should xử lý password rỗng", async () => {
    const req = createMockRequest("test@example.com", "");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(mockAuthUser);
    mockBcrypt.isValidPassword.mockReturnValue(false);

    await expect(login(req)).rejects.toThrow(UnauthorizedError);
  });

  it("should xử lý email với whitespace (nếu không được trim ở schema)", async () => {
    const req = createMockRequest("  test@example.com  ", "validPassword123");
    mockAuthModel.findOne = jest.fn().mockResolvedValue(null);

    await expect(login(req)).rejects.toThrow(UnauthorizedError);
  });
});
