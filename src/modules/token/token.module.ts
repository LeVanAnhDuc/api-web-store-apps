// types
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
// others
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import { createTokenRoutes } from "./token.routes";

export const createTokenModule = (
  authService: AuthenticationService,
  userService: UserService
) => {
  const tokenService = new TokenService(authService, userService);
  const tokenController = new TokenController(tokenService);

  return {
    tokenRouter: createTokenRoutes(tokenController),
    tokenService
  };
};
