/**
 * Unit tests for Signup Service - Verify OTP
 */

import { verifyOtp } from "../service";
import * as signupStore from "../utils/store";
import * as otpUtils from "../utils/otp";
import { BadRequestError } from "@/core/responses/error";
import { createMockRequest } from "./helpers";

// Mock dependencies
jest.mock("@/modules/auth/model");
jest.mock("../utils/store");
jest.mock("../utils/otp");

const mockStore = signupStore as jest.Mocked<typeof signupStore>;
const mockOtpUtils = otpUtils as jest.Mocked<typeof otpUtils>;

describe("Signup Service - Verify OTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.verifyOtp.mockResolvedValue(true);
    mockStore.isOtpAccountLocked.mockResolvedValue(false);
    mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
    mockStore.cleanupOtpData.mockResolvedValue(undefined);
    mockStore.storeSession.mockResolvedValue(undefined);

    mockOtpUtils.generateSessionId.mockReturnValue("session-token-123");
  });

  describe("Successful OTP verification", () => {
    it("should return success response với sessionToken", async () => {
      const req = createMockRequest({
        email: "test@example.com",
        otp: "123456"
      });

      const result = await verifyOtp(req);

      expect(result.message).toBe("signup:success.otpVerified");
      expect(result.data).toEqual({
        success: true,
        sessionToken: "session-token-123",
        expiresIn: 300
      });
    });

    it("should store session sau khi verify thành công", async () => {
      const req = createMockRequest({
        email: "test@example.com",
        otp: "123456"
      });

      await verifyOtp(req);

      expect(mockStore.storeSession).toHaveBeenCalledWith(
        "test@example.com",
        "session-token-123",
        300
      );
    });

    it("should cleanup OTP data sau khi verify thành công", async () => {
      const req = createMockRequest({
        email: "test@example.com",
        otp: "123456"
      });

      await verifyOtp(req);

      expect(mockStore.cleanupOtpData).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("Account lockout", () => {
    it("should throw BadRequestError khi tài khoản bị khóa", async () => {
      mockStore.isOtpAccountLocked.mockResolvedValue(true);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "123456"
      });

      await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.otpAttemptsExceeded");
    });

    it("should check lockout trước khi verify OTP", async () => {
      mockStore.isOtpAccountLocked.mockResolvedValue(true);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "123456"
      });

      try {
        await verifyOtp(req);
      } catch {
        // Expected
      }

      expect(mockStore.isOtpAccountLocked).toHaveBeenCalledWith(
        "test@example.com",
        5
      );
      expect(mockStore.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("Invalid OTP", () => {
    it("should throw BadRequestError với remaining attempts khi OTP sai", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "wrong-otp"
      });

      await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
      expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalledWith(
        "test@example.com",
        15
      );
    });

    it("should throw với message khác khi hết attempts", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(5);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "wrong-otp"
      });

      await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.otpAttemptsExceeded");
    });

    it("should increment failed attempts khi OTP sai", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(2);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "wrong-otp"
      });

      try {
        await verifyOtp(req);
      } catch {
        // Expected
      }

      expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalled();
    });

    it("should không store session khi verify thất bại", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      const req = createMockRequest({
        email: "test@example.com",
        otp: "wrong-otp"
      });

      try {
        await verifyOtp(req);
      } catch {
        // Expected
      }

      expect(mockStore.storeSession).not.toHaveBeenCalled();
    });
  });
});
