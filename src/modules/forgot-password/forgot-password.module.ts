import type { RedisClientType } from "redis";
import authenticationRepository from "@/repositories/authentication";
import { instanceRedis } from "@/database/redis";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { OtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import { MagicLinkForgotPasswordRepository } from "./repositories/magic-link-forgot-password.repository";
import { ResetTokenRepository } from "./repositories/reset-token.repository";
import { ForgotPasswordService } from "./forgot-password.service";
import { ForgotPasswordController } from "./forgot-password.controller";

const redisClient = instanceRedis.getClient() as RedisClientType;

const otpRepo = new OtpForgotPasswordRepository(redisClient);
const magicLinkRepo = new MagicLinkForgotPasswordRepository(redisClient);
const resetTokenRepo = new ResetTokenRepository(redisClient);

const forgotPasswordService = new ForgotPasswordService(
  authenticationRepository,
  loginHistoryService,
  otpRepo,
  magicLinkRepo,
  resetTokenRepo
);

const forgotPasswordController = new ForgotPasswordController(
  forgotPasswordService
);

export const forgotPasswordRouter = forgotPasswordController.router;
