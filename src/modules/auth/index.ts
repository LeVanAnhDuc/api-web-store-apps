// controllers
import AuthController from "./auth.controller";
// repositories
import AuthRepository from "./auth.repository";
import { userRepository } from "../user";
// services
import AuthService from "./auth.service";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository, userRepository);
const authController = new AuthController(authService);

export { authRepository, authService, authController };
