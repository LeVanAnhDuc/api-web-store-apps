import type { RedisClientType } from "redis";
import authenticationRepository from "@/repositories/authentication";
import userRepository from "@/repositories/user";
import { instanceRedis } from "@/database/redis";
import { OtpSignupRepository } from "./repositories/otp-signup.repository";
import { SessionSignupRepository } from "./repositories/session-signup.repository";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";

const redisClient = instanceRedis.getClient() as RedisClientType;

const otpSignupRepo = new OtpSignupRepository(redisClient);
const sessionSignupRepo = new SessionSignupRepository(redisClient);

const signupService = new SignupService(
  authenticationRepository,
  userRepository,
  otpSignupRepo,
  sessionSignupRepo
);
const signupController = new SignupController(signupService);

export const signupRouter = signupController.router;
export { signupService };
