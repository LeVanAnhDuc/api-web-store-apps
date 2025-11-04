// controllers
import AuthController from "./auth.controller";
// repositories
import AuthRepository from "./auth.repository";
// TODO: Uncomment when user module is implemented
// import { userRepository } from "../user";
// services
import AuthService from "./auth.service";

const authRepository = new AuthRepository();
// TODO: Uncomment when user module is implemented - pass userRepository as second argument
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export { authRepository, authService, authController };
