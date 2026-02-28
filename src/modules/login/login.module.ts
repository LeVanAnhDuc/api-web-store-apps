import authenticationRepository from "@/repositories/authentication";
import { LoginService } from "./login.service";
import { LoginController } from "./login.controller";

const loginService = new LoginService(authenticationRepository);
const loginController = new LoginController(loginService);

export const loginRouter = loginController.router;
export { loginService };
