import * as bcrypt from "bcrypt";
import { RedisCacheStore } from "@/app/services/implements/RedisCacheStore";
import { REDIS_KEYS } from "@/app/constants/redis";
import { OTP_CONFIG } from "@/modules/signup/constants";

const { SIGNUP } = REDIS_KEYS;

export class SignupCacheStore extends RedisCacheStore {
  private readonly keys = {
    OTP: SIGNUP.OTP,
    OTP_COOLDOWN: SIGNUP.OTP_COOLDOWN,
    OTP_FAILED_ATTEMPTS: SIGNUP.OTP_FAILED_ATTEMPTS,
    OTP_RESEND_COUNT: SIGNUP.OTP_RESEND_COUNT,
    SESSION: SIGNUP.SESSION
  };

  private buildKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  async checkOtpCoolDown(email: string): Promise<boolean> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    const exists = await this.exists(key);
    return exists === 0;
  }

  async setOtpCoolDown(email: string, cooldownSeconds: number): Promise<void> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    await this.setEx(key, cooldownSeconds, "1");
  }

  async deleteOtpCoolDown(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    await this.del(key);
  }

  async createAndStoreOtp(
    email: string,
    otp: string,
    expireTime: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.OTP, email);
    const hashedOtp = bcrypt.hashSync(otp, OTP_CONFIG.HASH_ROUNDS);
    await this.setEx(key, expireTime, hashedOtp);
  }

  async deleteOtp(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP, email);
    await this.del(key);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = this.buildKey(this.keys.OTP, email);
    const hashedOtp = await this.get(key);

    if (!hashedOtp) return false;

    return bcrypt.compareSync(otp, hashedOtp);
  }

  async storeSession(
    email: string,
    sessionId: string,
    expireTime: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.SESSION, email);
    await this.setEx(key, expireTime, sessionId);
  }

  async verifySession(email: string, sessionId: string): Promise<boolean> {
    const key = this.buildKey(this.keys.SESSION, email);
    const storedSessionId = await this.get(key);
    return storedSessionId === sessionId;
  }

  async deleteSession(email: string): Promise<void> {
    const key = this.buildKey(this.keys.SESSION, email);
    await this.del(key);
  }

  async incrementFailedOtpAttempts(
    email: string,
    lockoutDurationMinutes: number
  ): Promise<number> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    const count = await this.incr(key);

    if (count === 1) {
      await this.expire(key, lockoutDurationMinutes * 60);
    }

    return count;
  }

  async getFailedOtpAttempts(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearFailedOtpAttempts(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    await this.del(key);
  }

  async isOtpAccountLocked(
    email: string,
    maxAttempts: number
  ): Promise<boolean> {
    const failedAttempts = await this.getFailedOtpAttempts(email);
    return failedAttempts >= maxAttempts;
  }

  async incrementResendCount(
    email: string,
    windowSeconds: number
  ): Promise<number> {
    const key = this.buildKey(this.keys.OTP_RESEND_COUNT, email);
    const count = await this.incr(key);

    if (count === 1) {
      await this.expire(key, windowSeconds);
    }

    return count;
  }

  async getResendCount(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_RESEND_COUNT, email);
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearResendCount(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_RESEND_COUNT, email);
    await this.del(key);
  }

  async hasExceededResendLimit(
    email: string,
    maxResends: number
  ): Promise<boolean> {
    const resendCount = await this.getResendCount(email);
    return resendCount >= maxResends;
  }

  async cleanupOtpData(email: string): Promise<void> {
    await Promise.all([
      this.clearFailedOtpAttempts(email),
      this.deleteOtp(email),
      this.deleteOtpCoolDown(email)
    ]);
  }

  async cleanupSignupSession(email: string): Promise<void> {
    await Promise.all([
      this.deleteOtp(email),
      this.deleteSession(email),
      this.clearFailedOtpAttempts(email),
      this.deleteOtpCoolDown(email),
      this.clearResendCount(email)
    ]);
  }
}

const signupCacheStore = new SignupCacheStore();

export default signupCacheStore;
