// libs
import type { RedisClientType } from "redis";
// types
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { SendEmailService } from "@/services/email/email.service";
import type { RateLimiterMiddleware } from "@/middlewares";
// others
import { RedisOtpSignupRepository } from "./repositories/otp-signup.repository";
import { RedisSessionSignupRepository } from "./repositories/session-signup.repository";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";
import { createSignupRoutes } from "./signup.routes";

export const createSignupModule = (
  redisClient: RedisClientType,
  authService: AuthenticationService,
  userService: UserService,
  emailService: SendEmailService,
  rateLimiter: RateLimiterMiddleware
) => {
  const otpSignupRepo = new RedisOtpSignupRepository(redisClient);
  const sessionSignupRepo = new RedisSessionSignupRepository(redisClient);

  const signupService = new SignupService(
    authService,
    userService,
    otpSignupRepo,
    sessionSignupRepo,
    emailService
  );
  const signupController = new SignupController(signupService);

  return {
    signupRouter: createSignupRoutes(signupController, rateLimiter),
    signupService
  };
};
