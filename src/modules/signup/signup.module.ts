import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/repositories/authentication.repository";
import type { UserRepository } from "@/repositories/user.repository";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { OtpSignupRepository } from "@/repositories/otp-signup.repository";
import { SessionSignupRepository } from "@/repositories/session-signup.repository";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";

export const createSignupModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  userRepo: UserRepository,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpSignupRepo = new OtpSignupRepository(redisClient);
  const sessionSignupRepo = new SessionSignupRepository(redisClient);

  const signupService = new SignupService(
    authRepo,
    userRepo,
    otpSignupRepo,
    sessionSignupRepo
  );
  const signupController = new SignupController(signupService, rateLimiter);

  return {
    signupRouter: signupController.router,
    signupService
  };
};
