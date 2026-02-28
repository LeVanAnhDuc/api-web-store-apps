import { LogoutService } from "./logout.service";
import { LogoutController } from "./logout.controller";

const logoutService = new LogoutService();
const logoutController = new LogoutController(logoutService);

export const logoutRouter = logoutController.router;
export { logoutService };
