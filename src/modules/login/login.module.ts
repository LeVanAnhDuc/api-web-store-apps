import authenticationRepository from "@/repositories/authentication";
import { loginHistoryService } from "@/modules/login-history/login-history.module";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

const loginService = new LoginService(
  authenticationRepository,
  loginHistoryService
);
const loginController = new LoginController(loginService);

export const loginRouter = loginController.router;
export { loginService };
