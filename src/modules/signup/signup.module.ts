import type { RedisClientType } from "redis";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter";
import { RedisOtpSignupRepository } from "./repositories/otp-signup.repository";
import { RedisSessionSignupRepository } from "./repositories/session-signup.repository";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";

export const createSignupModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  userService: UserService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpSignupRepo = new RedisOtpSignupRepository(redisClient);
  const sessionSignupRepo = new RedisSessionSignupRepository(redisClient);

  const signupService = new SignupService(
    authService,
    userService,
    otpSignupRepo,
    sessionSignupRepo
  );
  const signupController = new SignupController(signupService, rateLimiter);

  return {
    signupRouter: signupController.router,
    signupService
  };
};
