import authenticationRepository from "@/repositories/authentication";
import { UnlockAccountService } from "./unlock-account.service";
import { UnlockAccountController } from "./unlock-account.controller";

const unlockAccountService = new UnlockAccountService(authenticationRepository);
const unlockAccountController = new UnlockAccountController(
  unlockAccountService
);

export const unlockAccountRouter = unlockAccountController.router;
export { unlockAccountService };
