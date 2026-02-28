import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { generateOtp } from "@/utils/crypto/otp";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { OTP_CONFIG } from "@/constants/config";

const KEYS = {
  OTP: REDIS_KEYS.SIGNUP.OTP,
  COOLDOWN: REDIS_KEYS.SIGNUP.OTP_COOLDOWN,
  FAILED_ATTEMPTS: REDIS_KEYS.SIGNUP.OTP_FAILED_ATTEMPTS,
  RESEND_COUNT: REDIS_KEYS.SIGNUP.OTP_RESEND_COUNT
};

export class OtpSignupRepository extends RedisCache {
  constructor(client: RedisClientType) {
    super(client, "OtpSignupRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private otpKey(email: string): string {
    return this.buildKey(KEYS.OTP, email);
  }

  private cooldownKey(email: string): string {
    return this.buildKey(KEYS.COOLDOWN, email);
  }

  private failedAttemptsKey(email: string): string {
    return this.buildKey(KEYS.FAILED_ATTEMPTS, email);
  }

  private resendCountKey(email: string): string {
    return this.buildKey(KEYS.RESEND_COUNT, email);
  }

  // ──────────────────────────────────────────────
  // OTP operations
  // ──────────────────────────────────────────────

  createOtp(): string {
    return generateOtp(OTP_CONFIG.LENGTH);
  }

  async storeHashed(email: string, otp: string, expiry: number): Promise<void> {
    const key = this.otpKey(email);
    const hashedOtp = hashValue(otp);
    await this.client.setEx(key, expiry, hashedOtp);
  }

  async clearOtp(email: string): Promise<void> {
    const key = this.otpKey(email);
    await this.client.del(key);
  }

  async verify(email: string, otp: string): Promise<boolean> {
    const key = this.otpKey(email);
    const hashedOtp = await this.client.get(key);

    if (!hashedOtp) return false;

    return isValidHashedValue(otp, hashedOtp);
  }

  // ──────────────────────────────────────────────
  // Cooldown operations
  // ──────────────────────────────────────────────

  async checkCooldown(email: string): Promise<boolean> {
    const key = this.cooldownKey(email);
    const exists = await this.client.exists(key);
    return exists === 0;
  }

  async getCooldownRemaining(email: string): Promise<number> {
    const key = this.cooldownKey(email);
    const ttl = await this.client.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  async setCooldown(email: string, seconds: number): Promise<void> {
    const key = this.cooldownKey(email);
    await this.client.setEx(key, seconds, "1");
  }

  async clearCooldown(email: string): Promise<void> {
    const key = this.cooldownKey(email);
    await this.client.del(key);
  }

  // ──────────────────────────────────────────────
  // Failed attempts operations
  // ──────────────────────────────────────────────

  async incrementFailedAttempts(
    email: string,
    lockoutDurationMinutes: number
  ): Promise<number> {
    const key = this.failedAttemptsKey(email);
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, lockoutDurationMinutes * 60);
    }

    return count;
  }

  async getFailedAttemptCount(email: string): Promise<number> {
    const key = this.failedAttemptsKey(email);
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearFailedAttempts(email: string): Promise<void> {
    const key = this.failedAttemptsKey(email);
    await this.client.del(key);
  }

  async isLocked(email: string, maxAttempts: number): Promise<boolean> {
    const attempts = await this.getFailedAttemptCount(email);
    return attempts >= maxAttempts;
  }

  // ──────────────────────────────────────────────
  // Resend count operations
  // ──────────────────────────────────────────────

  async incrementResendCount(
    email: string,
    windowSeconds: number
  ): Promise<number> {
    const key = this.resendCountKey(email);
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }

    return count;
  }

  async getResendAttemptCount(email: string): Promise<number> {
    const key = this.resendCountKey(email);
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearResendCount(email: string): Promise<void> {
    const key = this.resendCountKey(email);
    await this.client.del(key);
  }

  async hasExceededResendLimit(
    email: string,
    maxResends: number
  ): Promise<boolean> {
    const resendCount = await this.getResendAttemptCount(email);
    return resendCount >= maxResends;
  }

  // ──────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────

  async cleanupOtpData(email: string): Promise<void> {
    await Promise.all([
      this.clearFailedAttempts(email),
      this.clearOtp(email),
      this.clearCooldown(email)
    ]);
  }
}
