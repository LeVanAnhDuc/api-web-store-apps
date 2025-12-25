/**
 * Unit tests for Signup Store Utilities
 *
 * Test scenarios covered:
 * 1. OTP Cooldown - check, set, delete
 * 2. OTP Management - create, check exists, delete
 * 3. Session Management - store, verify, delete
 * 4. Failed OTP Attempts - increment, get, clear, check lock
 * 5. Cleanup Functions - cleanupOtpData, cleanupSignupSession
 * 6. Redis Error Handling
 */

import * as bcrypt from "bcrypt";
import instanceRedis from "@/database/redis/redis.database";
import {
  checkOtpCoolDown,
  setOtpCoolDown,
  deleteOtpCoolDown,
  createAndStoreOtp,
  verifyOtp,
  deleteOtp,
  storeSession,
  verifySession,
  deleteSession,
  incrementFailedOtpAttempts,
  getFailedOtpAttempts,
  clearFailedOtpAttempts,
  isOtpAccountLocked,
  cleanupOtpData,
  cleanupSignupSession
} from "../utils/store";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hashSync: jest.fn((otp: string) => `hashed_${otp}`),
  compareSync: jest.fn((otp: string, hash: string) => hash === `hashed_${otp}`)
}));

// Mock Redis client
const mockRedisClient = {
  exists: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
};

beforeEach(() => {
  jest.clearAllMocks();
  (instanceRedis.getClient as jest.Mock) = jest
    .fn()
    .mockReturnValue(mockRedisClient);
});

describe("Signup Store Utilities", () => {
  /*
   * ============================================================================
   * OTP COOLDOWN
   * ============================================================================
   */
  describe("checkOtpCoolDown", () => {
    describe("Khi có thể gửi OTP", () => {
      it("should return true khi cooldown key không tồn tại", async () => {
        mockRedisClient.exists.mockResolvedValue(0);

        const result = await checkOtpCoolDown("test@example.com");

        expect(result).toBe(true);
        expect(mockRedisClient.exists).toHaveBeenCalledWith(
          "otp-signup-cooldown:test@example.com"
        );
      });
    });

    describe("Khi đang trong cooldown", () => {
      it("should return false khi cooldown key tồn tại", async () => {
        mockRedisClient.exists.mockResolvedValue(1);

        const result = await checkOtpCoolDown("test@example.com");

        expect(result).toBe(false);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return true khi Redis error (fail-safe)", async () => {
        mockRedisClient.exists.mockRejectedValue(new Error("Redis error"));

        const result = await checkOtpCoolDown("test@example.com");

        expect(result).toBe(true);
      });
    });
  });

  describe("setOtpCoolDown", () => {
    it("should set cooldown key với expiry time", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await setOtpCoolDown("test@example.com", 60);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "otp-signup-cooldown:test@example.com",
        60,
        "1"
      );
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(
        setOtpCoolDown("test@example.com", 60)
      ).resolves.toBeUndefined();
    });
  });

  describe("deleteOtpCoolDown", () => {
    it("should delete cooldown key", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await deleteOtpCoolDown("test@example.com");

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup-cooldown:test@example.com"
      );
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(
        deleteOtpCoolDown("test@example.com")
      ).resolves.toBeUndefined();
    });
  });

  /*
   * ============================================================================
   * OTP MANAGEMENT
   * ============================================================================
   */
  describe("createAndStoreOtp", () => {
    it("should hash and store OTP với expiry time", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await createAndStoreOtp("test@example.com", "123456", 600);

      // Should store hashed OTP (using mock bcrypt.hashSync)
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "otp-signup:test@example.com",
        600,
        "hashed_123456"
      );
      expect(bcrypt.hashSync).toHaveBeenCalledWith("123456", 10);
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(
        createAndStoreOtp("test@example.com", "123456", 600)
      ).resolves.toBeUndefined();
    });
  });

  describe("verifyOtp", () => {
    describe("Khi OTP hợp lệ", () => {
      it("should return true khi OTP khớp với hash", async () => {
        // Store hashed OTP
        mockRedisClient.get.mockResolvedValue("hashed_123456");

        const result = await verifyOtp("test@example.com", "123456");

        expect(result).toBe(true);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          "otp-signup:test@example.com"
        );
        expect(bcrypt.compareSync).toHaveBeenCalledWith(
          "123456",
          "hashed_123456"
        );
      });
    });

    describe("Khi OTP không hợp lệ", () => {
      it("should return false khi OTP không tồn tại", async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await verifyOtp("test@example.com", "123456");

        expect(result).toBe(false);
        expect(bcrypt.compareSync).not.toHaveBeenCalled();
      });

      it("should return false khi OTP không khớp với hash", async () => {
        mockRedisClient.get.mockResolvedValue("hashed_654321");

        const result = await verifyOtp("test@example.com", "123456");

        expect(result).toBe(false);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return false khi Redis error", async () => {
        mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

        const result = await verifyOtp("test@example.com", "123456");

        expect(result).toBe(false);
      });
    });
  });

  describe("deleteOtp", () => {
    it("should delete OTP key", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await deleteOtp("test@example.com");

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup:test@example.com"
      );
    });

    it("should không throw error khi key không tồn tại", async () => {
      mockRedisClient.del.mockResolvedValue(0);

      await expect(deleteOtp("test@example.com")).resolves.toBeUndefined();
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(deleteOtp("test@example.com")).resolves.toBeUndefined();
    });
  });

  /*
   * ============================================================================
   * SESSION MANAGEMENT
   * ============================================================================
   */
  describe("storeSession", () => {
    it("should store session với expiry time", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await storeSession("test@example.com", "session-id-123", 600);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "session-signup:test@example.com",
        600,
        "session-id-123"
      );
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(
        storeSession("test@example.com", "session-id-123", 600)
      ).resolves.toBeUndefined();
    });
  });

  describe("verifySession", () => {
    describe("Khi session hợp lệ", () => {
      it("should return true khi session khớp", async () => {
        mockRedisClient.get.mockResolvedValue("session-id-123");

        const result = await verifySession(
          "test@example.com",
          "session-id-123"
        );

        expect(result).toBe(true);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          "session-signup:test@example.com"
        );
      });
    });

    describe("Khi session không hợp lệ", () => {
      it("should return false khi session không tồn tại", async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await verifySession(
          "test@example.com",
          "session-id-123"
        );

        expect(result).toBe(false);
      });

      it("should return false khi session không khớp", async () => {
        mockRedisClient.get.mockResolvedValue("different-session-id");

        const result = await verifySession(
          "test@example.com",
          "session-id-123"
        );

        expect(result).toBe(false);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return false khi Redis error", async () => {
        mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

        const result = await verifySession(
          "test@example.com",
          "session-id-123"
        );

        expect(result).toBe(false);
      });
    });
  });

  describe("deleteSession", () => {
    it("should delete session key", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await deleteSession("test@example.com");

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "session-signup:test@example.com"
      );
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(deleteSession("test@example.com")).resolves.toBeUndefined();
    });
  });

  /*
   * ============================================================================
   * FAILED OTP ATTEMPTS
   * ============================================================================
   */
  describe("incrementFailedOtpAttempts", () => {
    describe("Lần thất bại đầu tiên", () => {
      it("should increment và set expiry cho lần đầu tiên", async () => {
        mockRedisClient.incr.mockResolvedValue(1);
        mockRedisClient.expire.mockResolvedValue(1);

        const result = await incrementFailedOtpAttempts("test@example.com", 10);

        expect(result).toBe(1);
        expect(mockRedisClient.incr).toHaveBeenCalledWith(
          "otp-failed-attempts:test@example.com"
        );
        expect(mockRedisClient.expire).toHaveBeenCalledWith(
          "otp-failed-attempts:test@example.com",
          600 // 10 * 60
        );
      });
    });

    describe("Các lần thất bại tiếp theo", () => {
      it("should chỉ increment, không set expiry", async () => {
        mockRedisClient.incr.mockResolvedValue(2);

        const result = await incrementFailedOtpAttempts("test@example.com", 10);

        expect(result).toBe(2);
        expect(mockRedisClient.expire).not.toHaveBeenCalled();
      });

      it("should return đúng số lần thất bại", async () => {
        mockRedisClient.incr.mockResolvedValue(5);

        const result = await incrementFailedOtpAttempts("test@example.com", 10);

        expect(result).toBe(5);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return 0 khi Redis error", async () => {
        mockRedisClient.incr.mockRejectedValue(new Error("Redis error"));

        const result = await incrementFailedOtpAttempts("test@example.com", 10);

        expect(result).toBe(0);
      });
    });
  });

  describe("getFailedOtpAttempts", () => {
    it("should return số lần thất bại khi có value", async () => {
      mockRedisClient.get.mockResolvedValue("3");

      const result = await getFailedOtpAttempts("test@example.com");

      expect(result).toBe(3);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        "otp-failed-attempts:test@example.com"
      );
    });

    it("should return 0 khi không có value", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getFailedOtpAttempts("test@example.com");

      expect(result).toBe(0);
    });

    it("should return 0 khi Redis error", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await getFailedOtpAttempts("test@example.com");

      expect(result).toBe(0);
    });
  });

  describe("clearFailedOtpAttempts", () => {
    it("should delete failed attempts key", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await clearFailedOtpAttempts("test@example.com");

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-failed-attempts:test@example.com"
      );
    });

    it("should không throw error khi Redis error", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(
        clearFailedOtpAttempts("test@example.com")
      ).resolves.toBeUndefined();
    });
  });

  describe("isOtpAccountLocked", () => {
    describe("Khi tài khoản bị khóa", () => {
      it("should return true khi failed attempts >= maxAttempts", async () => {
        mockRedisClient.get.mockResolvedValue("5");

        const result = await isOtpAccountLocked("test@example.com", 5);

        expect(result).toBe(true);
      });

      it("should return true khi failed attempts > maxAttempts", async () => {
        mockRedisClient.get.mockResolvedValue("10");

        const result = await isOtpAccountLocked("test@example.com", 5);

        expect(result).toBe(true);
      });
    });

    describe("Khi tài khoản chưa bị khóa", () => {
      it("should return false khi failed attempts < maxAttempts", async () => {
        mockRedisClient.get.mockResolvedValue("4");

        const result = await isOtpAccountLocked("test@example.com", 5);

        expect(result).toBe(false);
      });

      it("should return false khi không có failed attempts", async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await isOtpAccountLocked("test@example.com", 5);

        expect(result).toBe(false);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return false khi Redis error (fail-safe)", async () => {
        mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

        const result = await isOtpAccountLocked("test@example.com", 5);

        expect(result).toBe(false);
      });
    });
  });

  /*
   * ============================================================================
   * CLEANUP FUNCTIONS
   * ============================================================================
   */
  describe("cleanupOtpData", () => {
    it("should cleanup all OTP-related data", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await cleanupOtpData("test@example.com");

      // Should delete: failed attempts, OTP, and cooldown
      expect(mockRedisClient.del).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-failed-attempts:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup-cooldown:test@example.com"
      );
    });

    it("should không throw error khi một số operations fail", async () => {
      mockRedisClient.del
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error("Redis error"))
        .mockResolvedValueOnce(1);

      // Should not throw
      await expect(cleanupOtpData("test@example.com")).resolves.toBeUndefined();
    });
  });

  describe("cleanupSignupSession", () => {
    it("should cleanup all signup session data", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await cleanupSignupSession("test@example.com");

      // Should delete: OTP, session, failed attempts, cooldown, resend count
      expect(mockRedisClient.del).toHaveBeenCalledTimes(5);
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "session-signup:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-failed-attempts:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-signup-cooldown:test@example.com"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "otp-resend-count:test@example.com"
      );
    });

    it("should không throw error khi operations fail", async () => {
      mockRedisClient.del
        .mockRejectedValueOnce(new Error("Redis error"))
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await expect(
        cleanupSignupSession("test@example.com")
      ).resolves.toBeUndefined();
    });
  });

  /*
   * ============================================================================
   * EDGE CASES
   * ============================================================================
   */
  describe("Edge cases", () => {
    it("should handle email with special characters", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      await checkOtpCoolDown("user+tag@example.com");

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        "otp-signup-cooldown:user+tag@example.com"
      );
    });

    it("should handle email with uppercase (case-sensitive keys)", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      await checkOtpCoolDown("TEST@EXAMPLE.COM");

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        "otp-signup-cooldown:TEST@EXAMPLE.COM"
      );
    });

    it("should handle concurrent operations", async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.setEx.mockResolvedValue("OK");
      mockRedisClient.del.mockResolvedValue(1);

      // Simulate concurrent operations
      await Promise.all([
        checkOtpCoolDown("test@example.com"),
        setOtpCoolDown("test@example.com", 60),
        createAndStoreOtp("test@example.com", "123456", 600)
      ]);

      expect(mockRedisClient.exists).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(2);
    });
  });
});
