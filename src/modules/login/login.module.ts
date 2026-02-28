import type { RedisClientType } from "redis";
import authenticationRepository from "@/repositories/authentication";
import { instanceRedis } from "@/database/redis";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { OtpLoginRepository } from "./repositories/otp-login.repository";
import { MagicLinkLoginRepository } from "./repositories/magic-link-login.repository";
import { FailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

const redisClient = instanceRedis.getClient() as RedisClientType;

const otpLoginRepo = new OtpLoginRepository(redisClient);
const magicLinkLoginRepo = new MagicLinkLoginRepository(redisClient);
const failedAttemptsRepo = new FailedAttemptsRepository(redisClient);

const loginService = new LoginService(
  authenticationRepository,
  loginHistoryService,
  otpLoginRepo,
  magicLinkLoginRepo,
  failedAttemptsRepo
);
const loginController = new LoginController(loginService);

export const loginRouter = loginController.router;
export { loginService, failedAttemptsRepo };
