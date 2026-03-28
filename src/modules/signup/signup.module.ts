import type { RedisClientType } from "redis";
import type { AuthenticationRepository } from "@/modules/authentication/repositories/authentication.repository";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { RedisOtpSignupRepository } from "./repositories/otp-signup.repository";
import { RedisSessionSignupRepository } from "./repositories/session-signup.repository";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";

export const createSignupModule = (
  redisClient: RedisClientType,
  authRepo: AuthenticationRepository,
  userRepo: UserRepository,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpSignupRepo = new RedisOtpSignupRepository(redisClient);
  const sessionSignupRepo = new RedisSessionSignupRepository(redisClient);

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
