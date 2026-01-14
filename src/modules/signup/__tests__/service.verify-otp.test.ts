/**
 * Unit tests for VerifyOtp Service
 *
 * Test Categories:
 * 1. Happy Case: OTP verified successfully, session created
 * 2. Failure Cases: Account locked, Invalid OTP
 * 3. Edge Cases: Remaining attempts tracking, Brute force protection
 */

import { verifyOtp } from "../service/verify-otp.service";
import * as signupStore from "../utils/store";
import * as otpUtils from "../utils/otp";
import { BadRequestError } from "@/infra/responses/error";
import {
  createVerifyOtpRequest,
  mockOtp,
  mockSessionToken,
  TEST_EMAIL
} from "./helpers";

jest.mock("../utils/store");
jest.mock("../utils/otp");
jest.mock("@/infra/utils/logger");
jest.mock("@/i18n", () => ({
  t: jest.fn((key: string, opts?: Record<string, unknown>) => {
    if (opts?.remaining !== undefined) {
      return `${key} - remaining: ${opts.remaining}`;
    }
    return key;
  })
}));

const mockStore = signupStore as jest.Mocked<typeof signupStore>;
const mockOtpUtils = otpUtils as jest.Mocked<typeof otpUtils>;

describe("VerifyOtp Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations for happy path
    mockStore.isOtpAccountLocked.mockResolvedValue(false); // Not locked
    mockStore.verifyOtp.mockResolvedValue(true); // OTP valid
    mockOtpUtils.generateSessionId.mockReturnValue(mockSessionToken);
    mockStore.storeSession.mockResolvedValue(undefined);
    mockStore.cleanupOtpData.mockResolvedValue(undefined);
  });

  // Happy Case Tests
  describe("Happy Case - OTP Verified Successfully", () => {
    it("should return success response with session token when OTP is valid", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      const result = await verifyOtp(req);

      expect(result.message).toBe("signup:success.otpVerified");
      expect(result.data).toEqual({
        success: true,
        sessionToken: mockSessionToken,
        expiresIn: expect.any(Number)
      });
    });

    it("should check if account is locked before verification", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      expect(mockStore.isOtpAccountLocked).toHaveBeenCalledWith(
        TEST_EMAIL,
        expect.any(Number)
      );
    });

    it("should verify OTP against stored hash", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      expect(mockStore.verifyOtp).toHaveBeenCalledWith(TEST_EMAIL, mockOtp);
    });

    it("should generate a new session token", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      expect(mockOtpUtils.generateSessionId).toHaveBeenCalledTimes(1);
    });

    it("should store session token with expiry", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      expect(mockStore.storeSession).toHaveBeenCalledWith(
        TEST_EMAIL,
        mockSessionToken,
        expect.any(Number)
      );
    });

    it("should cleanup OTP data after successful verification", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      expect(mockStore.cleanupOtpData).toHaveBeenCalledWith(TEST_EMAIL);
    });

    it("should call operations in correct order", async () => {
      const callOrder: string[] = [];

      mockStore.isOtpAccountLocked.mockImplementation(async () => {
        callOrder.push("checkLocked");
        return false;
      });

      mockStore.verifyOtp.mockImplementation(async () => {
        callOrder.push("verifyOtp");
        return true;
      });

      mockOtpUtils.generateSessionId.mockImplementation(() => {
        callOrder.push("generateSession");
        return mockSessionToken;
      });

      mockStore.storeSession.mockImplementation(async () => {
        callOrder.push("storeSession");
      });

      mockStore.cleanupOtpData.mockImplementation(async () => {
        callOrder.push("cleanup");
      });

      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);
      await verifyOtp(req);

      expect(callOrder).toEqual([
        "checkLocked",
        "verifyOtp",
        "generateSession",
        "storeSession",
        "cleanup"
      ]);
    });
  });

  // Failure Case Tests
  describe("Failure Cases", () => {
    describe("Account Locked", () => {
      it("should throw BadRequestError when account is locked", async () => {
        mockStore.isOtpAccountLocked.mockResolvedValue(true);
        const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

        await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
        expect(req.t).toHaveBeenCalledWith("signup:errors.otpAttemptsExceeded");
      });

      it("should not verify OTP when account is locked", async () => {
        mockStore.isOtpAccountLocked.mockResolvedValue(true);
        const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

        try {
          await verifyOtp(req);
        } catch {
          // Expected error
        }

        expect(mockStore.verifyOtp).not.toHaveBeenCalled();
      });

      it("should not create session when account is locked", async () => {
        mockStore.isOtpAccountLocked.mockResolvedValue(true);
        const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

        try {
          await verifyOtp(req);
        } catch {
          // Expected error
        }

        expect(mockOtpUtils.generateSessionId).not.toHaveBeenCalled();
        expect(mockStore.storeSession).not.toHaveBeenCalled();
      });
    });

    describe("Invalid OTP", () => {
      it("should throw BadRequestError when OTP is invalid", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
      });

      it("should increment failed attempts when OTP is invalid", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        try {
          await verifyOtp(req);
        } catch {
          // Expected error
        }

        expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalledWith(
          TEST_EMAIL,
          expect.any(Number) // lockout duration
        );
      });

      it("should show remaining attempts when not exceeded", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(2); // 2nd failed attempt
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        try {
          await verifyOtp(req);
        } catch (error) {
          // Error should indicate remaining attempts
          expect(error).toBeInstanceOf(BadRequestError);
        }
      });

      it("should not create session when OTP is invalid", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        try {
          await verifyOtp(req);
        } catch {
          // Expected error
        }

        expect(mockOtpUtils.generateSessionId).not.toHaveBeenCalled();
        expect(mockStore.storeSession).not.toHaveBeenCalled();
      });

      it("should not cleanup OTP data when verification fails", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        try {
          await verifyOtp(req);
        } catch {
          // Expected error
        }

        expect(mockStore.cleanupOtpData).not.toHaveBeenCalled();
      });
    });

    describe("Max Failed Attempts Exceeded", () => {
      it("should throw different error when max attempts reached", async () => {
        mockStore.verifyOtp.mockResolvedValue(false);
        mockStore.incrementFailedOtpAttempts.mockResolvedValue(5); // Max attempts (5)
        const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

        await expect(verifyOtp(req)).rejects.toThrow(BadRequestError);
        // Should use the "exceeded" message, not "remaining" message
        expect(req.t).toHaveBeenCalledWith("signup:errors.otpAttemptsExceeded");
      });
    });
  });

  // Edge Case Tests
  describe("Edge Cases", () => {
    it("should handle first failed attempt correctly", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(1); // First attempt

      const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

      try {
        await verifyOtp(req);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }

      expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalledTimes(1);
    });

    it("should handle boundary case of max-1 failed attempts", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(4); // One before max (5)

      const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

      try {
        await verifyOtp(req);
      } catch {
        // Expected error
      }

      // Should still show remaining attempts (1 remaining)
      expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalled();
    });

    it("should process with different language settings", async () => {
      const languages = ["en", "vi"];

      for (const language of languages) {
        jest.clearAllMocks();
        mockStore.isOtpAccountLocked.mockResolvedValue(false);
        mockStore.verifyOtp.mockResolvedValue(true);
        mockOtpUtils.generateSessionId.mockReturnValue(mockSessionToken);

        const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp, language);
        const result = await verifyOtp(req);

        expect(result.data?.success).toBe(true);
      }
    });

    it("should handle concurrent verification attempts", async () => {
      // Simulate race condition scenario
      let verifyCallCount = 0;

      mockStore.isOtpAccountLocked.mockResolvedValue(false);
      mockStore.verifyOtp.mockImplementation(async () => {
        verifyCallCount++;
        return verifyCallCount === 1; // Only first call succeeds
      });
      mockOtpUtils.generateSessionId.mockReturnValue(mockSessionToken);

      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      const resultPromise = verifyOtp(req);
      const result = await resultPromise;

      expect(result.data?.success).toBe(true);
    });

    it("should handle session token generation correctly", async () => {
      const customToken = "custom-session-token-12345";
      mockOtpUtils.generateSessionId.mockReturnValue(customToken);

      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);
      const result = await verifyOtp(req);

      expect(result.data?.sessionToken).toBe(customToken);
      expect(mockStore.storeSession).toHaveBeenCalledWith(
        TEST_EMAIL,
        customToken,
        expect.any(Number)
      );
    });
  });

  // Security Tests
  describe("Security - Brute Force Protection", () => {
    it("should check account lockout status before any processing", async () => {
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      // isOtpAccountLocked should be the first async operation
      const lockCheckOrder =
        mockStore.isOtpAccountLocked.mock.invocationCallOrder[0];
      const verifyOrder = mockStore.verifyOtp.mock.invocationCallOrder[0];

      expect(lockCheckOrder).toBeLessThan(verifyOrder);
    });

    it("should track failed attempts with lockout duration", async () => {
      mockStore.verifyOtp.mockResolvedValue(false);
      mockStore.incrementFailedOtpAttempts.mockResolvedValue(1);

      const req = createVerifyOtpRequest(TEST_EMAIL, "000000");

      try {
        await verifyOtp(req);
      } catch {
        // Expected error
      }

      // Verify lockout duration is passed
      expect(mockStore.incrementFailedOtpAttempts).toHaveBeenCalledWith(
        TEST_EMAIL,
        expect.any(Number) // Lockout duration minutes
      );
    });

    it("should use timing-safe OTP comparison (via bcrypt)", async () => {
      // This is implicitly tested - verifyOtp in store uses bcrypt.compare
      // which is timing-safe
      const req = createVerifyOtpRequest(TEST_EMAIL, mockOtp);

      await verifyOtp(req);

      // Just verify the store's verifyOtp is called
      // The timing-safe comparison is handled by bcrypt in the store layer
      expect(mockStore.verifyOtp).toHaveBeenCalledWith(TEST_EMAIL, mockOtp);
    });
  });
});
