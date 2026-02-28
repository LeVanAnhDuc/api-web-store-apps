import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";

const tokenService = new TokenService();
const tokenController = new TokenController(tokenService);

export const tokenRouter = tokenController.router;
export { tokenService };
