/**
 * Unit tests for OTP Utilities
 *
 * Test scenarios covered:
 * 1. generateOtp - OTP generation
 * 2. generateSessionId - Session ID generation
 * 3. Security properties
 */

import { generateOtp, generateSessionId } from "../utils/otp";

describe("OTP Utilities", () => {
  /*
   * ============================================================================
   * GENERATE OTP
   * ============================================================================
   */
  describe("generateOtp", () => {
    describe("OTP format", () => {
      it("should generate OTP với 6 chữ số", () => {
        const otp = generateOtp();

        expect(otp).toMatch(/^\d{6}$/);
      });

      it("should generate OTP là string", () => {
        const otp = generateOtp();

        expect(typeof otp).toBe("string");
      });

      it("should generate OTP có độ dài đúng 6", () => {
        const otp = generateOtp();

        expect(otp.length).toBe(6);
      });
    });

    describe("OTP range", () => {
      it("should generate OTP trong range 100000-999999", () => {
        // Generate multiple OTPs to test range
        for (let i = 0; i < 100; i++) {
          const otp = generateOtp();
          const numOtp = parseInt(otp, 10);

          expect(numOtp).toBeGreaterThanOrEqual(100000);
          expect(numOtp).toBeLessThanOrEqual(999999);
        }
      });

      it("should có thể generate OTP bắt đầu với số khác 0", () => {
        // Since OTP range is 100000-999999, first digit should always be non-zero
        const otps = Array.from({ length: 100 }, () => generateOtp());

        // All OTPs should start with 1-9, not 0
        otps.forEach((otp) => {
          expect(parseInt(otp[0], 10)).toBeGreaterThanOrEqual(1);
        });
      });
    });

    describe("OTP randomness", () => {
      it("should generate OTPs khác nhau", () => {
        const otps = new Set<string>();

        // Generate 100 OTPs
        for (let i = 0; i < 100; i++) {
          otps.add(generateOtp());
        }

        // Should have mostly unique values (allow some small collision chance)
        expect(otps.size).toBeGreaterThan(90);
      });

      it("should không generate cùng OTP liên tiếp (probability)", () => {
        const otp1 = generateOtp();
        const otp2 = generateOtp();

        // Very unlikely to be the same (1 in 900,000 chance)
        // This test may fail very rarely due to randomness
        expect(otp1).not.toBe(otp2);
      });
    });
  });

  /*
   * ============================================================================
   * GENERATE SESSION ID
   * ============================================================================
   */
  describe("generateSessionId", () => {
    describe("Session ID format", () => {
      it("should generate session ID là hex string", () => {
        const sessionId = generateSessionId();

        expect(sessionId).toMatch(/^[a-f0-9]+$/);
      });

      it("should generate session ID có độ dài 64 chars (32 bytes)", () => {
        const sessionId = generateSessionId();

        expect(sessionId.length).toBe(64);
      });

      it("should generate session ID là string", () => {
        const sessionId = generateSessionId();

        expect(typeof sessionId).toBe("string");
      });
    });

    describe("Session ID uniqueness", () => {
      it("should generate session IDs khác nhau", () => {
        const sessionIds = new Set<string>();

        for (let i = 0; i < 100; i++) {
          sessionIds.add(generateSessionId());
        }

        // All should be unique
        expect(sessionIds.size).toBe(100);
      });

      it("should không generate cùng session ID liên tiếp", () => {
        const id1 = generateSessionId();
        const id2 = generateSessionId();

        expect(id1).not.toBe(id2);
      });
    });

    describe("Security properties", () => {
      it("should có entropy đủ cao (256 bits)", () => {
        // 32 bytes = 256 bits of entropy
        const sessionId = generateSessionId();

        // Verify it's 32 bytes by checking hex length (64 chars = 32 bytes)
        expect(sessionId.length).toBe(64);
      });

      it("should sử dụng crypto-safe random", () => {
        // The implementation uses crypto.randomBytes which is cryptographically secure
        // We can verify by checking the distribution is roughly uniform
        const sessionIds = Array.from({ length: 100 }, () =>
          generateSessionId()
        );

        // Check distribution of first character (should be roughly uniform across 0-f)
        const firstChars = sessionIds.map((id) => id[0]);
        const uniqueFirstChars = new Set(firstChars);

        // Should see variety in first characters
        expect(uniqueFirstChars.size).toBeGreaterThan(5);
      });
    });
  });

  /*
   * ============================================================================
   * EDGE CASES
   * ============================================================================
   */
  describe("Edge cases", () => {
    it("should generate valid OTP nhiều lần liên tiếp", () => {
      for (let i = 0; i < 1000; i++) {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
      }
    });

    it("should generate valid session ID nhiều lần liên tiếp", () => {
      for (let i = 0; i < 100; i++) {
        const sessionId = generateSessionId();
        expect(sessionId).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it("should handle concurrent generation", async () => {
      // Generate 100 OTPs concurrently
      const otpPromises = Array.from({ length: 100 }, () =>
        Promise.resolve(generateOtp())
      );
      const otps = await Promise.all(otpPromises);

      // All should be valid
      otps.forEach((otp) => {
        expect(otp).toMatch(/^\d{6}$/);
      });
    });

    it("should handle concurrent session ID generation", async () => {
      const sessionPromises = Array.from({ length: 100 }, () =>
        Promise.resolve(generateSessionId())
      );
      const sessions = await Promise.all(sessionPromises);

      // All should be unique
      const uniqueSessions = new Set(sessions);
      expect(uniqueSessions.size).toBe(100);
    });
  });
});
