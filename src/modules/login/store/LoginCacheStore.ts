import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { RedisCacheStore } from "@/app/services/implements/RedisCacheStore";
import { REDIS_KEYS } from "@/app/constants/redis";
import {
  LOGIN_LOCKOUT,
  LOGIN_OTP_CONFIG,
  MAGIC_LINK_CONFIG,
  ACCOUNT_UNLOCK_CONFIG
} from "@/modules/login/constants";

const { LOGIN } = REDIS_KEYS;

export class LoginCacheStore extends RedisCacheStore {
  private readonly keys = {
    FAILED_ATTEMPTS: LOGIN.FAILED_ATTEMPTS,
    LOCKOUT: LOGIN.LOCKOUT,
    OTP: LOGIN.OTP,
    OTP_COOLDOWN: LOGIN.OTP_COOLDOWN,
    OTP_FAILED_ATTEMPTS: LOGIN.OTP_FAILED_ATTEMPTS,
    OTP_RESEND_COUNT: LOGIN.OTP_RESEND_COUNT,
    MAGIC_LINK: LOGIN.MAGIC_LINK,
    MAGIC_LINK_COOLDOWN: LOGIN.MAGIC_LINK_COOLDOWN,
    UNLOCK_TOKEN: LOGIN.UNLOCK_TOKEN
  };

  private buildKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  private calculateLockoutDuration(attemptCount: number): number {
    const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

    const duration =
      LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS];

    if (attemptCount >= 10) {
      return MAX_LOCKOUT_SECONDS;
    }

    return duration || 0;
  }

  async checkLoginLockout(
    email: string
  ): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    const key = this.buildKey(this.keys.LOCKOUT, email);
    const ttlValue = await this.ttl(key);

    if (ttlValue > 0) {
      return { isLocked: true, remainingSeconds: ttlValue };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  async getFailedLoginAttempts(email: string): Promise<number> {
    const key = this.buildKey(this.keys.FAILED_ATTEMPTS, email);
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementFailedLoginAttempts(
    email: string
  ): Promise<{ attemptCount: number; lockoutSeconds: number }> {
    const attemptsKey = this.buildKey(this.keys.FAILED_ATTEMPTS, email);
    const lockoutKey = this.buildKey(this.keys.LOCKOUT, email);

    const attemptCount = await this.incr(attemptsKey);

    if (attemptCount === 1) {
      await this.expire(attemptsKey, LOGIN_LOCKOUT.RESET_WINDOW_SECONDS);
    }

    const lockoutSeconds = this.calculateLockoutDuration(attemptCount);

    if (lockoutSeconds > 0) {
      await this.setEx(lockoutKey, lockoutSeconds, attemptCount.toString());
    }

    return { attemptCount, lockoutSeconds };
  }

  async resetFailedLoginAttempts(email: string): Promise<void> {
    const attemptsKey = this.buildKey(this.keys.FAILED_ATTEMPTS, email);
    const lockoutKey = this.buildKey(this.keys.LOCKOUT, email);

    await Promise.all([this.del(attemptsKey), this.del(lockoutKey)]);
  }

  async checkLoginOtpCooldown(email: string): Promise<boolean> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    const exists = await this.exists(key);
    return exists === 0;
  }

  async getLoginOtpCooldownRemaining(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    const ttlValue = await this.ttl(key);
    return ttlValue > 0 ? ttlValue : 0;
  }

  async setLoginOtpCooldown(
    email: string,
    cooldownSeconds: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    await this.setEx(key, cooldownSeconds, "1");
  }

  async deleteLoginOtpCooldown(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_COOLDOWN, email);
    await this.del(key);
  }

  async createAndStoreLoginOtp(
    email: string,
    otp: string,
    expireTime: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.OTP, email);
    const hashedOtp = bcrypt.hashSync(otp, LOGIN_OTP_CONFIG.LENGTH);
    await this.setEx(key, expireTime, hashedOtp);
  }

  async deleteLoginOtp(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP, email);
    await this.del(key);
  }

  async verifyLoginOtp(email: string, otp: string): Promise<boolean> {
    const key = this.buildKey(this.keys.OTP, email);
    const hashedOtp = await this.get(key);

    if (!hashedOtp) return false;

    return bcrypt.compareSync(otp, hashedOtp);
  }

  async incrementFailedLoginOtpAttempts(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    const count = await this.incr(key);

    if (count === 1) {
      await this.expire(key, LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES * 60);
    }

    return count;
  }

  async getFailedLoginOtpAttempts(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearFailedLoginOtpAttempts(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_FAILED_ATTEMPTS, email);
    await this.del(key);
  }

  async isLoginOtpLocked(email: string): Promise<boolean> {
    const failedAttempts = await this.getFailedLoginOtpAttempts(email);
    return failedAttempts >= LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS;
  }

  async incrementLoginOtpResendCount(
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

  async getLoginOtpResendCount(email: string): Promise<number> {
    const key = this.buildKey(this.keys.OTP_RESEND_COUNT, email);
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async clearLoginOtpResendCount(email: string): Promise<void> {
    const key = this.buildKey(this.keys.OTP_RESEND_COUNT, email);
    await this.del(key);
  }

  async hasExceededLoginOtpResendLimit(email: string): Promise<boolean> {
    const resendCount = await this.getLoginOtpResendCount(email);
    return resendCount >= LOGIN_OTP_CONFIG.MAX_RESEND_ATTEMPTS;
  }

  async cleanupLoginOtpData(email: string): Promise<void> {
    await Promise.all([
      this.deleteLoginOtp(email),
      this.deleteLoginOtpCooldown(email),
      this.clearFailedLoginOtpAttempts(email),
      this.clearLoginOtpResendCount(email)
    ]);
  }

  generateMagicLinkToken(): string {
    return crypto
      .randomBytes(MAGIC_LINK_CONFIG.TOKEN_LENGTH / 2)
      .toString("hex");
  }

  async checkMagicLinkCooldown(email: string): Promise<boolean> {
    const key = this.buildKey(this.keys.MAGIC_LINK_COOLDOWN, email);
    const exists = await this.exists(key);
    return exists === 0;
  }

  async getMagicLinkCooldownRemaining(email: string): Promise<number> {
    const key = this.buildKey(this.keys.MAGIC_LINK_COOLDOWN, email);
    const ttlValue = await this.ttl(key);
    return ttlValue > 0 ? ttlValue : 0;
  }

  async setMagicLinkCooldown(
    email: string,
    cooldownSeconds: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.MAGIC_LINK_COOLDOWN, email);
    await this.setEx(key, cooldownSeconds, "1");
  }

  async deleteMagicLinkCooldown(email: string): Promise<void> {
    const key = this.buildKey(this.keys.MAGIC_LINK_COOLDOWN, email);
    await this.del(key);
  }

  async createAndStoreMagicLink(
    email: string,
    token: string,
    expireTime: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.MAGIC_LINK, email);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await this.setEx(key, expireTime, hashedToken);
  }

  async verifyMagicLinkToken(email: string, token: string): Promise<boolean> {
    const key = this.buildKey(this.keys.MAGIC_LINK, email);
    const storedHash = await this.get(key);

    if (!storedHash) return false;

    const providedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  }

  async deleteMagicLink(email: string): Promise<void> {
    const key = this.buildKey(this.keys.MAGIC_LINK, email);
    await this.del(key);
  }

  async cleanupMagicLinkData(email: string): Promise<void> {
    await Promise.all([
      this.deleteMagicLink(email),
      this.deleteMagicLinkCooldown(email)
    ]);
  }

  generateUnlockToken(): string {
    return crypto
      .randomBytes(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH / 2)
      .toString("hex");
  }

  async createAndStoreUnlockToken(
    email: string,
    token: string,
    expireTime: number
  ): Promise<void> {
    const key = this.buildKey(this.keys.UNLOCK_TOKEN, email);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await this.setEx(key, expireTime, hashedToken);
  }

  async verifyUnlockToken(email: string, token: string): Promise<boolean> {
    const key = this.buildKey(this.keys.UNLOCK_TOKEN, email);
    const storedHash = await this.get(key);

    if (!storedHash) return false;

    const providedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  }

  async deleteUnlockToken(email: string): Promise<void> {
    const key = this.buildKey(this.keys.UNLOCK_TOKEN, email);
    await this.del(key);
  }

  async unlockAccount(email: string): Promise<void> {
    await Promise.all([
      this.resetFailedLoginAttempts(email),
      this.deleteUnlockToken(email),
      this.cleanupLoginOtpData(email)
    ]);
  }
}

const loginCacheStore = new LoginCacheStore();

export default loginCacheStore;
