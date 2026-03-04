import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";
import type { createClient } from "redis";
import RedisStore from "rate-limit-redis";
import { TooManyRequestsError } from "@/config/responses/error";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { RATE_LIMIT_CONFIG } from "@/constants/config";

type RedisClient = ReturnType<typeof createClient>;
type RateLimitHandler = (req: Request, res: Response) => void;

export class RateLimiterMiddleware {
  private readonly redisClient: RedisClient;

  // All limiters are initialized once in the constructor after Redis connects.
  // loadRateLimiters() runs before loadModules(app), so by the time controllers
  // access these properties during initRoutes(), they are guaranteed to be ready.
  public readonly loginByIp: RateLimitRequestHandler;
  public readonly signupOtpByIp: RateLimitRequestHandler;
  public readonly signupOtpByEmail: RateLimitRequestHandler;
  public readonly checkEmailByIp: RateLimitRequestHandler;
  public readonly loginOtpByIp: RateLimitRequestHandler;
  public readonly loginOtpByEmail: RateLimitRequestHandler;
  public readonly magicLinkByIp: RateLimitRequestHandler;
  public readonly magicLinkByEmail: RateLimitRequestHandler;
  public readonly forgotPasswordOtpByIp: RateLimitRequestHandler;
  public readonly forgotPasswordOtpByEmail: RateLimitRequestHandler;
  public readonly forgotPasswordMagicLinkByIp: RateLimitRequestHandler;
  public readonly forgotPasswordMagicLinkByEmail: RateLimitRequestHandler;
  public readonly forgotPasswordResetByIp: RateLimitRequestHandler;
  public readonly contactByIp: RateLimitRequestHandler;
  public readonly updateProfileByIp: RateLimitRequestHandler;
  public readonly uploadAvatarByIp: RateLimitRequestHandler;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;

    // Prevent brute force attacks from single IP
    this.loginByIp = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.LOGIN.PASSWORD.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.LOGIN.PASSWORD.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "login:errors.rateLimitExceeded"
      )
    });

    // Prevent distributed OTP spam attacks
    this.signupOtpByIp = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.SIGNUP.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "signup:errors.rateLimitExceeded"
      )
    });

    // Prevent email inbox spam
    this.signupOtpByEmail = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_EMAIL.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.SIGNUP.EMAIL),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: this.createRateLimitExceededHandler(
        "signup:errors.rateLimitExceeded"
      )
    });

    // Prevent email enumeration attacks
    this.checkEmailByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.SIGNUP.CHECK_EMAIL.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.SIGNUP.CHECK_EMAIL.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.CHECK_EMAIL.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "signup:errors.rateLimitExceeded"
      )
    });

    this.loginOtpByIp = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN_OTP.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "login:errors.rateLimitExceeded"
      )
    });

    this.loginOtpByEmail = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_EMAIL.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN_OTP.EMAIL),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: this.createRateLimitExceededHandler(
        "login:errors.rateLimitExceeded"
      )
    });

    // Prevent magic link spam from single IP
    this.magicLinkByIp = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.MAGIC_LINK.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "login:errors.rateLimitExceeded"
      )
    });

    // Prevent targeted email abuse via magic links
    this.magicLinkByEmail = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_EMAIL.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_EMAIL.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.MAGIC_LINK.EMAIL),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: this.createRateLimitExceededHandler(
        "login:errors.rateLimitExceeded"
      )
    });

    // Prevent forgot-password OTP spam from single IP
    this.forgotPasswordOtpByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.FORGOT_PASSWORD.OTP.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.FORGOT_PASSWORD.OTP.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(
        REDIS_KEYS.RATE_LIMIT.FORGOT_PASSWORD.OTP_IP
      ),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "forgotPassword:errors.rateLimitExceeded"
      )
    });

    // Prevent forgot-password OTP targeted email abuse
    this.forgotPasswordOtpByEmail = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.FORGOT_PASSWORD.OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.FORGOT_PASSWORD.OTP.PER_EMAIL.MAX_REQUESTS,
      store: this.createRedisStore(
        REDIS_KEYS.RATE_LIMIT.FORGOT_PASSWORD.OTP_EMAIL
      ),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: this.createRateLimitExceededHandler(
        "forgotPassword:errors.rateLimitExceeded"
      )
    });

    // Prevent forgot-password magic link spam from single IP
    this.forgotPasswordMagicLinkByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.FORGOT_PASSWORD.MAGIC_LINK.PER_IP.WINDOW_SECONDS *
        1000,
      max: RATE_LIMIT_CONFIG.FORGOT_PASSWORD.MAGIC_LINK.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(
        REDIS_KEYS.RATE_LIMIT.FORGOT_PASSWORD.MAGIC_LINK_IP
      ),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "forgotPassword:errors.rateLimitExceeded"
      )
    });

    // Prevent forgot-password magic link targeted email abuse
    this.forgotPasswordMagicLinkByEmail = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.FORGOT_PASSWORD.MAGIC_LINK.PER_EMAIL.WINDOW_SECONDS *
        1000,
      max: RATE_LIMIT_CONFIG.FORGOT_PASSWORD.MAGIC_LINK.PER_EMAIL.MAX_REQUESTS,
      store: this.createRedisStore(
        REDIS_KEYS.RATE_LIMIT.FORGOT_PASSWORD.MAGIC_LINK_EMAIL
      ),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: this.createRateLimitExceededHandler(
        "forgotPassword:errors.rateLimitExceeded"
      )
    });

    // Prevent contact form spam from single IP
    this.contactByIp = rateLimit({
      windowMs: RATE_LIMIT_CONFIG.CONTACT.SUBMIT.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.CONTACT.SUBMIT.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.CONTACT.IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "contactAdmin:errors.rateLimitExceeded"
      )
    });

    // Prevent profile update abuse from single IP
    this.updateProfileByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.USER.UPDATE_PROFILE.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.USER.UPDATE_PROFILE.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.USER.UPDATE_IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "user:errors.rateLimitExceeded"
      )
    });

    // Prevent avatar upload abuse from single IP
    this.uploadAvatarByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.USER.UPLOAD_AVATAR.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.USER.UPLOAD_AVATAR.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.USER.AVATAR_IP),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "user:errors.rateLimitExceeded"
      )
    });

    // Prevent forgot-password reset brute force from single IP
    this.forgotPasswordResetByIp = rateLimit({
      windowMs:
        RATE_LIMIT_CONFIG.FORGOT_PASSWORD.RESET.PER_IP.WINDOW_SECONDS * 1000,
      max: RATE_LIMIT_CONFIG.FORGOT_PASSWORD.RESET.PER_IP.MAX_REQUESTS,
      store: this.createRedisStore(
        REDIS_KEYS.RATE_LIMIT.FORGOT_PASSWORD.RESET_IP
      ),
      standardHeaders: true,
      legacyHeaders: false,
      handler: this.createRateLimitExceededHandler(
        "forgotPassword:errors.rateLimitExceeded"
      )
    });
  }

  private createRedisStore(prefix: string): RedisStore {
    return new RedisStore({
      sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
      prefix
    });
  }

  private createRateLimitExceededHandler(
    messageKey: I18n.Key
  ): RateLimitHandler {
    return (req: Request, res: Response): void => {
      const { t } = req;
      const error = new TooManyRequestsError(t(messageKey));

      res.status(error.status).json({
        timestamp: new Date().toISOString(),
        route: req.originalUrl,
        message: error.message,
        error: error.error
      });
    };
  }
}
