/**
 * Unit tests for Login Store Utilities
 *
 * Test scenarios covered:
 * 1. checkLoginLockout - Check if account is locked
 * 2. getFailedLoginAttempts - Get current failed attempt count
 * 3. incrementFailedLoginAttempts - Progressive lockout logic
 * 4. resetFailedLoginAttempts - Clear lockout after successful login
 */

import instanceRedis from "@/database/redis/redis.database";
import {
  checkLoginLockout,
  getFailedLoginAttempts,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts
} from "../utils/store";

// Mock Redis client với tất cả methods cần thiết
const mockRedisClient = {
  ttl: jest.fn(),
  get: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn()
};

beforeEach(() => {
  jest.clearAllMocks();
  (instanceRedis.getClient as jest.Mock) = jest
    .fn()
    .mockReturnValue(mockRedisClient);
});

describe("Login Store Utilities", () => {
  /*
   * ============================================================================
   * checkLoginLockout - Kiểm tra tài khoản có bị khóa không
   * ============================================================================
   */
  describe("checkLoginLockout", () => {
    describe("Khi tài khoản đang bị khóa", () => {
      it("should return isLocked=true với thời gian còn lại khi TTL > 0", async () => {
        mockRedisClient.ttl.mockResolvedValue(300); // 5 phút còn lại

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: true, remainingSeconds: 300 });
        expect(mockRedisClient.ttl).toHaveBeenCalledWith(
          "login-lockout:test@example.com"
        );
      });

      it("should return isLocked=true với TTL = 1 (edge case)", async () => {
        mockRedisClient.ttl.mockResolvedValue(1);

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: true, remainingSeconds: 1 });
      });
    });

    describe("Khi tài khoản không bị khóa", () => {
      it("should return isLocked=false khi TTL = -1 (key không tồn tại)", async () => {
        mockRedisClient.ttl.mockResolvedValue(-1);

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
      });

      it("should return isLocked=false khi TTL = -2 (key đã expire)", async () => {
        mockRedisClient.ttl.mockResolvedValue(-2);

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
      });

      it("should return isLocked=false khi TTL = 0", async () => {
        mockRedisClient.ttl.mockResolvedValue(0);

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return isLocked=false khi Redis throw error (fail-safe)", async () => {
        mockRedisClient.ttl.mockRejectedValue(
          new Error("Redis connection error")
        );

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
      });

      it("should return isLocked=false khi Redis timeout", async () => {
        mockRedisClient.ttl.mockRejectedValue(new Error("ETIMEDOUT"));

        const result = await checkLoginLockout("test@example.com");

        expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
      });
    });
  });

  /*
   * ============================================================================
   * getFailedLoginAttempts - Lấy số lần đăng nhập thất bại
   * ============================================================================
   */
  describe("getFailedLoginAttempts", () => {
    describe("Khi có failed attempts", () => {
      it("should return số lần thất bại khi có value trong Redis", async () => {
        mockRedisClient.get.mockResolvedValue("5");

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(5);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          "login-failed-attempts:test@example.com"
        );
      });

      it("should return 1 khi chỉ có 1 lần thất bại", async () => {
        mockRedisClient.get.mockResolvedValue("1");

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(1);
      });

      it("should return số lớn khi có nhiều lần thất bại (brute force)", async () => {
        mockRedisClient.get.mockResolvedValue("100");

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(100);
      });
    });

    describe("Khi không có failed attempts", () => {
      it("should return 0 khi value là null (chưa từng thất bại)", async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(0);
      });

      it("should return 0 khi value là undefined", async () => {
        mockRedisClient.get.mockResolvedValue(undefined);

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(0);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return 0 khi Redis error (fail-safe)", async () => {
        mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

        const result = await getFailedLoginAttempts("test@example.com");

        expect(result).toBe(0);
      });
    });
  });

  /*
   * ============================================================================
   * incrementFailedLoginAttempts - Progressive Lockout Logic
   * ============================================================================
   */
  describe("incrementFailedLoginAttempts", () => {
    describe("Các lần thất bại không bị lockout (1-4)", () => {
      it("should increment và set expiry cho lần thất bại đầu tiên", async () => {
        mockRedisClient.incr.mockResolvedValue(1);
        mockRedisClient.expire.mockResolvedValue(1);

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(1);
        expect(result.lockoutSeconds).toBe(0);
        expect(mockRedisClient.incr).toHaveBeenCalledWith(
          "login-failed-attempts:test@example.com"
        );
        expect(mockRedisClient.expire).toHaveBeenCalledWith(
          "login-failed-attempts:test@example.com",
          1800 // 30 phút window
        );
        expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      });

      it("should không set expiry cho lần thứ 2", async () => {
        mockRedisClient.incr.mockResolvedValue(2);

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(2);
        expect(result.lockoutSeconds).toBe(0);
        expect(mockRedisClient.expire).not.toHaveBeenCalled();
        expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      });

      it("should không set expiry cho lần thứ 3", async () => {
        mockRedisClient.incr.mockResolvedValue(3);

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(3);
        expect(result.lockoutSeconds).toBe(0);
      });

      it("should không lockout cho lần thứ 4 (cuối cùng trước lockout)", async () => {
        mockRedisClient.incr.mockResolvedValue(4);

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(4);
        expect(result.lockoutSeconds).toBe(0);
        expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      });
    });

    describe("Progressive lockout (5-10)", () => {
      it("should lockout 30s cho lần thứ 5", async () => {
        mockRedisClient.incr.mockResolvedValue(5);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(5);
        expect(result.lockoutSeconds).toBe(30);
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          "login-lockout:test@example.com",
          30,
          "5"
        );
      });

      it("should lockout 60s (1 phút) cho lần thứ 6", async () => {
        mockRedisClient.incr.mockResolvedValue(6);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.attemptCount).toBe(6);
        expect(result.lockoutSeconds).toBe(60);
      });

      it("should lockout 120s (2 phút) cho lần thứ 7", async () => {
        mockRedisClient.incr.mockResolvedValue(7);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(120);
      });

      it("should lockout 240s (4 phút) cho lần thứ 8", async () => {
        mockRedisClient.incr.mockResolvedValue(8);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(240);
      });

      it("should lockout 480s (8 phút) cho lần thứ 9", async () => {
        mockRedisClient.incr.mockResolvedValue(9);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(480);
      });

      it("should lockout 1800s (30 phút - max) cho lần thứ 10", async () => {
        mockRedisClient.incr.mockResolvedValue(10);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(1800);
      });
    });

    describe("Max lockout cho attempts > 10", () => {
      it("should apply max lockout 1800s cho lần thứ 11", async () => {
        mockRedisClient.incr.mockResolvedValue(11);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(1800);
      });

      it("should apply max lockout 1800s cho lần thứ 15 (brute force)", async () => {
        mockRedisClient.incr.mockResolvedValue(15);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(1800);
      });

      it("should apply max lockout 1800s cho lần thứ 100", async () => {
        mockRedisClient.incr.mockResolvedValue(100);
        mockRedisClient.setEx.mockResolvedValue("OK");

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result.lockoutSeconds).toBe(1800);
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should return zeros khi Redis incr error (fail-safe)", async () => {
        mockRedisClient.incr.mockRejectedValue(new Error("Redis error"));

        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result).toEqual({ attemptCount: 0, lockoutSeconds: 0 });
      });

      it("should vẫn return đúng khi setEx error sau incr thành công", async () => {
        mockRedisClient.incr.mockResolvedValue(5);
        mockRedisClient.setEx.mockRejectedValue(new Error("Redis setEx error"));

        // Function sẽ catch error và return zeros
        const result = await incrementFailedLoginAttempts("test@example.com");

        expect(result).toEqual({ attemptCount: 0, lockoutSeconds: 0 });
      });
    });
  });

  /*
   * ============================================================================
   * resetFailedLoginAttempts - Reset sau khi đăng nhập thành công
   * ============================================================================
   */
  describe("resetFailedLoginAttempts", () => {
    describe("Xóa thành công", () => {
      it("should xóa cả 2 keys: failed-attempts và lockout", async () => {
        mockRedisClient.del.mockResolvedValue(1);

        await resetFailedLoginAttempts("test@example.com");

        expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      });

      it("should không throw error khi keys không tồn tại", async () => {
        mockRedisClient.del.mockResolvedValue(0); // Key không tồn tại

        await expect(
          resetFailedLoginAttempts("test@example.com")
        ).resolves.toBeUndefined();
      });
    });

    describe("Xử lý lỗi Redis", () => {
      it("should không throw error khi Redis error (fail-safe)", async () => {
        mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

        await expect(
          resetFailedLoginAttempts("test@example.com")
        ).resolves.toBeUndefined();
      });
    });
  });
});
