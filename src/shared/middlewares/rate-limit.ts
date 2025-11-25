import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import instanceRedis from "@/database/redis/redis.database";
import { LOGIN_RATE_LIMITS } from "@/shared/constants/modules/login";
import { SIGNUP_RATE_LIMITS } from "@/shared/constants/modules/signup";
import { TooManyRequestsError } from "@/core/responses/error";

/**
 * Creates a Redis store for rate limiting with lazy initialization
 */
const createRedisStore = (prefix: string): RedisStore =>
  new RedisStore({
    sendCommand: (...args: string[]) =>
      instanceRedis.getClient().sendCommand(args),
    prefix
  });

/**
 * Creates a rate limit exceeded handler with custom error message
 */
const createRateLimitHandler =
  (messageKey: I18n.Key) =>
  (
    req: Parameters<NonNullable<Parameters<typeof rateLimit>[0]["handler"]>>[0],
    res: Parameters<NonNullable<Parameters<typeof rateLimit>[0]["handler"]>>[1]
  ): void => {
    const { t } = req;
    const error = new TooManyRequestsError(t(messageKey));

    res.status(error.status).json({
      timestamp: new Date().toISOString(),
      route: req.originalUrl,
      message: error.message,
      error: error.error
    });
  };

/*
 * Login Rate Limiter
 * Purpose: Prevent brute force attacks from a single IP address
 * Note: Account-level protection (progressive lockout) is handled in login service
 */
let loginRateLimiter: RateLimitRequestHandler | null = null;

export const getLoginRateLimiter = (): RateLimitRequestHandler => {
  if (loginRateLimiter === null) {
    loginRateLimiter = rateLimit({
      windowMs: LOGIN_RATE_LIMITS.PER_IP.WINDOW_SECONDS * 1000,
      max: LOGIN_RATE_LIMITS.PER_IP.MAX_REQUESTS,
      store: createRedisStore("rate-limit:login:ip:"),
      standardHeaders: true,
      legacyHeaders: false,
      handler: createRateLimitHandler("login:errors.rateLimitExceeded")
    });
  }

  return loginRateLimiter;
};

/*
 * Signup Rate Limiters
 * Two layers of protection:
 * 1. IP-based: Prevents spam from single source
 * 2. Email-based: Prevents abuse targeting specific email
 */
let signupIpRateLimiter: RateLimitRequestHandler | null = null;
let signupEmailRateLimiter: RateLimitRequestHandler | null = null;

/**
 * IP-based rate limiter for signup/send-otp endpoint
 * Limits requests per IP to prevent distributed attacks
 */
export const getSignupIpRateLimiter = (): RateLimitRequestHandler => {
  if (signupIpRateLimiter === null) {
    signupIpRateLimiter = rateLimit({
      windowMs: SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.WINDOW_SECONDS * 1000,
      max: SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.MAX_REQUESTS,
      store: createRedisStore("rate-limit:signup:ip:"),
      standardHeaders: true,
      legacyHeaders: false,
      handler: createRateLimitHandler("signup:errors.rateLimitExceeded")
    });
  }

  return signupIpRateLimiter;
};

/**
 * Email-based rate limiter for signup/send-otp endpoint
 * Limits OTP requests per email to prevent email spam
 */
export const getSignupEmailRateLimiter = (): RateLimitRequestHandler => {
  if (signupEmailRateLimiter === null) {
    signupEmailRateLimiter = rateLimit({
      windowMs: SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
      max: SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.MAX_REQUESTS,
      store: createRedisStore("rate-limit:signup:email:"),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
      handler: createRateLimitHandler("signup:errors.rateLimitExceeded")
    });
  }

  return signupEmailRateLimiter;
};
