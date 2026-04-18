// types
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// others
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import { createTokenRoutes } from "./token.routes";

export const createTokenModule = (authService: AuthenticationService) => {
  const tokenService = new TokenService(authService);
  const tokenController = new TokenController(tokenService);

  return {
    tokenRouter: createTokenRoutes(tokenController),
    tokenService
  };
};
