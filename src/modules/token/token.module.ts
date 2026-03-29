// others
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import { createTokenRoutes } from "./token.routes";

export const createTokenModule = () => {
  const tokenService = new TokenService();
  const tokenController = new TokenController(tokenService);

  return {
    tokenRouter: createTokenRoutes(tokenController),
    tokenService
  };
};
