/**
 * Unit tests for Signup Store (Redis Operations)
 *
 * Test Categories:
 * 1. OTP Operations - Create, Verify, Delete
 * 2. Cooldown Operations - Check, Set, Delete
 * 3. Session Operations - Store, Verify, Delete
 * 4. Failed Attempts Operations - Increment, Get, Clear, Lock check
 * 5. Resend Count Operations - Increment, Get, Clear, Limit check
 * 6. Cleanup Operations - Cleanup OTP data, Cleanup session
 */

import * as signupStore from "../utils/store";
import instanceRedis from "@/database/redis/redis.database";
import * as bcrypt from "bcrypt";

// Mock Redis client
jest.mock("@/database/redis/redis.database", () => ({
  getClient: jest.fn()
}));

jest.mock("bcrypt");
jest.mock("@/core/utils/logger");

const mockRedis = {
  exists: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
};

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("Signup Store (Redis Operations)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (instanceRedis.getClient as jest.Mock).mockReturnValue(mockRedis);
  });

  // ===========================================================================
  // OTP Cooldown Operations
  // ===========================================================================
  describe("OTP Cooldown Operations", () => {
    describe("checkOtpCoolDown", () => {
      it("should return true when no cooldown exists", async () => {
        mockRedis.exists.mockResolvedValue(0);

        const result = await signupStore.checkOtpCoolDown("test@example.com");

        expect(result).toBe(true);
        expect(mockRedis.exists).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });

      it("should return false when cooldown exists", async () => {
        mockRedis.exists.mockResolvedValue(1);

        const result = await signupStore.checkOtpCoolDown("test@example.com");

        expect(result).toBe(false);
      });

      it("should return true on Redis error (fail-open)", async () => {
        mockRedis.exists.mockRejectedValue(new Error("Redis error"));

        const result = await signupStore.checkOtpCoolDown("test@example.com");

        expect(result).toBe(true);
      });
    });

    describe("setOtpCoolDown", () => {
      it("should set cooldown with correct TTL", async () => {
        mockRedis.setEx.mockResolvedValue("OK");

        await signupStore.setOtpCoolDown("test@example.com", 60);

        expect(mockRedis.setEx).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com"),
          60,
          "1"
        );
      });

      it("should handle Redis error gracefully", async () => {
        mockRedis.setEx.mockRejectedValue(new Error("Redis error"));

        // Should not throw
        await expect(
          signupStore.setOtpCoolDown("test@example.com", 60)
        ).resolves.toBeUndefined();
      });
    });

    describe("deleteOtpCoolDown", () => {
      it("should delete cooldown key", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.deleteOtpCoolDown("test@example.com");

        expect(mockRedis.del).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });
    });
  });

  // ===========================================================================
  // OTP Operations
  // ===========================================================================
  describe("OTP Operations", () => {
    describe("createAndStoreOtp", () => {
      it("should hash OTP and store with TTL", async () => {
        mockBcrypt.hashSync.mockReturnValue("hashed-otp");
        mockRedis.setEx.mockResolvedValue("OK");

        await signupStore.createAndStoreOtp("test@example.com", "123456", 300);

        expect(mockBcrypt.hashSync).toHaveBeenCalledWith(
          "123456",
          expect.any(Number)
        );
        expect(mockRedis.setEx).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com"),
          300,
          "hashed-otp"
        );
      });

      it("should use secure hash rounds", async () => {
        mockBcrypt.hashSync.mockReturnValue("hashed-otp");

        await signupStore.createAndStoreOtp("test@example.com", "123456", 300);

        // Hash rounds should be >= 10 for security
        const hashRounds = mockBcrypt.hashSync.mock.calls[0][1] as number;
        expect(hashRounds).toBeGreaterThanOrEqual(10);
      });
    });

    describe("verifyOtp", () => {
      it("should return true when OTP matches", async () => {
        mockRedis.get.mockResolvedValue("hashed-otp");
        mockBcrypt.compareSync.mockReturnValue(true);

        const result = await signupStore.verifyOtp(
          "test@example.com",
          "123456"
        );

        expect(result).toBe(true);
        expect(mockBcrypt.compareSync).toHaveBeenCalledWith(
          "123456",
          "hashed-otp"
        );
      });

      it("should return false when OTP does not match", async () => {
        mockRedis.get.mockResolvedValue("hashed-otp");
        mockBcrypt.compareSync.mockReturnValue(false);

        const result = await signupStore.verifyOtp(
          "test@example.com",
          "000000"
        );

        expect(result).toBe(false);
      });

      it("should return false when no OTP stored", async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await signupStore.verifyOtp(
          "test@example.com",
          "123456"
        );

        expect(result).toBe(false);
        expect(mockBcrypt.compareSync).not.toHaveBeenCalled();
      });

      it("should return false on Redis error", async () => {
        mockRedis.get.mockRejectedValue(new Error("Redis error"));

        const result = await signupStore.verifyOtp(
          "test@example.com",
          "123456"
        );

        expect(result).toBe(false);
      });
    });

    describe("deleteOtp", () => {
      it("should delete OTP key", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.deleteOtp("test@example.com");

        expect(mockRedis.del).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });
    });
  });

  // ===========================================================================
  // Session Operations
  // ===========================================================================
  describe("Session Operations", () => {
    describe("storeSession", () => {
      it("should store session token with TTL", async () => {
        mockRedis.setEx.mockResolvedValue("OK");

        await signupStore.storeSession(
          "test@example.com",
          "session-token-123",
          900
        );

        expect(mockRedis.setEx).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com"),
          900,
          "session-token-123"
        );
      });
    });

    describe("verifySession", () => {
      it("should return true when session matches", async () => {
        mockRedis.get.mockResolvedValue("session-token-123");

        const result = await signupStore.verifySession(
          "test@example.com",
          "session-token-123"
        );

        expect(result).toBe(true);
      });

      it("should return false when session does not match", async () => {
        mockRedis.get.mockResolvedValue("different-token");

        const result = await signupStore.verifySession(
          "test@example.com",
          "session-token-123"
        );

        expect(result).toBe(false);
      });

      it("should return false when no session stored", async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await signupStore.verifySession(
          "test@example.com",
          "session-token-123"
        );

        expect(result).toBe(false);
      });

      it("should return false on Redis error", async () => {
        mockRedis.get.mockRejectedValue(new Error("Redis error"));

        const result = await signupStore.verifySession(
          "test@example.com",
          "session-token-123"
        );

        expect(result).toBe(false);
      });
    });

    describe("deleteSession", () => {
      it("should delete session key", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.deleteSession("test@example.com");

        expect(mockRedis.del).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });
    });
  });

  // ===========================================================================
  // Failed Attempts Operations
  // ===========================================================================
  describe("Failed Attempts Operations", () => {
    describe("incrementFailedOtpAttempts", () => {
      it("should increment and return count", async () => {
        mockRedis.incr.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(true);

        const result = await signupStore.incrementFailedOtpAttempts(
          "test@example.com",
          15
        );

        expect(result).toBe(1);
        expect(mockRedis.incr).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });

      it("should set expiry on first failed attempt", async () => {
        mockRedis.incr.mockResolvedValue(1); // First attempt
        mockRedis.expire.mockResolvedValue(true);

        await signupStore.incrementFailedOtpAttempts("test@example.com", 15);

        expect(mockRedis.expire).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com"),
          15 * 60 // 15 minutes in seconds
        );
      });

      it("should not set expiry on subsequent attempts", async () => {
        mockRedis.incr.mockResolvedValue(2); // Second attempt
        mockRedis.expire.mockResolvedValue(true);

        await signupStore.incrementFailedOtpAttempts("test@example.com", 15);

        expect(mockRedis.expire).not.toHaveBeenCalled();
      });

      it("should return 0 on Redis error", async () => {
        mockRedis.incr.mockRejectedValue(new Error("Redis error"));

        const result = await signupStore.incrementFailedOtpAttempts(
          "test@example.com",
          15
        );

        expect(result).toBe(0);
      });
    });

    describe("getFailedOtpAttempts", () => {
      it("should return count when key exists", async () => {
        mockRedis.get.mockResolvedValue("3");

        const result =
          await signupStore.getFailedOtpAttempts("test@example.com");

        expect(result).toBe(3);
      });

      it("should return 0 when key does not exist", async () => {
        mockRedis.get.mockResolvedValue(null);

        const result =
          await signupStore.getFailedOtpAttempts("test@example.com");

        expect(result).toBe(0);
      });
    });

    describe("clearFailedOtpAttempts", () => {
      it("should delete failed attempts key", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.clearFailedOtpAttempts("test@example.com");

        expect(mockRedis.del).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });
    });

    describe("isOtpAccountLocked", () => {
      it("should return true when attempts >= max", async () => {
        mockRedis.get.mockResolvedValue("5");

        const result = await signupStore.isOtpAccountLocked(
          "test@example.com",
          5
        );

        expect(result).toBe(true);
      });

      it("should return false when attempts < max", async () => {
        mockRedis.get.mockResolvedValue("4");

        const result = await signupStore.isOtpAccountLocked(
          "test@example.com",
          5
        );

        expect(result).toBe(false);
      });

      it("should return false when no attempts recorded", async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await signupStore.isOtpAccountLocked(
          "test@example.com",
          5
        );

        expect(result).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Resend Count Operations
  // ===========================================================================
  describe("Resend Count Operations", () => {
    describe("incrementResendCount", () => {
      it("should increment and return count", async () => {
        mockRedis.incr.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(true);

        const result = await signupStore.incrementResendCount(
          "test@example.com",
          3600
        );

        expect(result).toBe(1);
      });

      it("should set expiry on first resend", async () => {
        mockRedis.incr.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(true);

        await signupStore.incrementResendCount("test@example.com", 3600);

        expect(mockRedis.expire).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com"),
          3600
        );
      });
    });

    describe("getResendCount", () => {
      it("should return count when key exists", async () => {
        mockRedis.get.mockResolvedValue("2");

        const result = await signupStore.getResendCount("test@example.com");

        expect(result).toBe(2);
      });

      it("should return 0 when key does not exist", async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await signupStore.getResendCount("test@example.com");

        expect(result).toBe(0);
      });
    });

    describe("clearResendCount", () => {
      it("should delete resend count key", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.clearResendCount("test@example.com");

        expect(mockRedis.del).toHaveBeenCalledWith(
          expect.stringContaining("test@example.com")
        );
      });
    });

    describe("hasExceededResendLimit", () => {
      it("should return true when resends >= max", async () => {
        mockRedis.get.mockResolvedValue("5");

        const result = await signupStore.hasExceededResendLimit(
          "test@example.com",
          5
        );

        expect(result).toBe(true);
      });

      it("should return false when resends < max", async () => {
        mockRedis.get.mockResolvedValue("4");

        const result = await signupStore.hasExceededResendLimit(
          "test@example.com",
          5
        );

        expect(result).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Cleanup Operations
  // ===========================================================================
  describe("Cleanup Operations", () => {
    describe("cleanupOtpData", () => {
      it("should call all cleanup functions in parallel", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.cleanupOtpData("test@example.com");

        // Should delete: failed attempts, OTP, cooldown
        expect(mockRedis.del).toHaveBeenCalledTimes(3);
      });
    });

    describe("cleanupSignupSession", () => {
      it("should call all cleanup functions in parallel", async () => {
        mockRedis.del.mockResolvedValue(1);

        await signupStore.cleanupSignupSession("test@example.com");

        // Should delete: OTP, session, failed attempts, cooldown, resend count
        expect(mockRedis.del).toHaveBeenCalledTimes(5);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle empty email gracefully", async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await signupStore.checkOtpCoolDown("");

      expect(result).toBe(true);
    });

    it("should handle special characters in email", async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await signupStore.checkOtpCoolDown("test+tag@example.com");

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        expect.stringContaining("test+tag@example.com")
      );
    });

    it("should handle concurrent operations", async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(true);

      // Simulate concurrent increments
      const promises = [
        signupStore.incrementFailedOtpAttempts("test@example.com", 15),
        signupStore.incrementFailedOtpAttempts("test@example.com", 15),
        signupStore.incrementFailedOtpAttempts("test@example.com", 15)
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([1, 1, 1]); // All return what Redis returns
      expect(mockRedis.incr).toHaveBeenCalledTimes(3);
    });
  });
});
