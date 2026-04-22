// repositories
import { MongoAuthenticationRepository } from "./authentication.repository";
// others
import { AuthenticationService } from "./authentication.service";

export const createAuthenticationModule = () => {
  const authRepo = new MongoAuthenticationRepository();
  const authService = new AuthenticationService(authRepo);

  return { authService };
};
