import type { RedisClientType } from "redis";
import authenticationRepository from "@/repositories/authentication";
import { instanceRedis } from "@/database/redis";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { failedAttemptsRepo } from "@/modules/login/login.module";
import { UnlockAccountRepository } from "./repositories/unlock-account.repository";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

const redisClient = instanceRedis.getClient() as RedisClientType;

const unlockAccountRepo = new UnlockAccountRepository(redisClient);

const unlockAccountService = new UnlockAccountService(
  authenticationRepository,
  loginHistoryService,
  failedAttemptsRepo,
  unlockAccountRepo
);
const unlockAccountController = new UnlockAccountController(
  unlockAccountService
);

export const unlockAccountRouter = unlockAccountController.router;
export { unlockAccountService };
