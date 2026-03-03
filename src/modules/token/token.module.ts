import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";

export const createTokenModule = () => {
  const tokenService = new TokenService();
  const tokenController = new TokenController(tokenService);

  return {
    tokenRouter: tokenController.router,
    tokenService
  };
};
