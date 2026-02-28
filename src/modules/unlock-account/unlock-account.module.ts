import authenticationRepository from "@/repositories/authentication";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { failedAttemptsRepo } from "@/modules/login/login.module";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

const unlockAccountService = new UnlockAccountService(
  authenticationRepository,
  loginHistoryService,
  failedAttemptsRepo
);
const unlockAccountController = new UnlockAccountController(
  unlockAccountService
);

export const unlockAccountRouter = unlockAccountController.router;
export { unlockAccountService };
