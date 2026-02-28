import authenticationRepository from "@/repositories/authentication";
import userRepository from "@/repositories/user";
import { SignupService } from "./signup.service";
import { SignupController } from "./signup.controller";

const signupService = new SignupService(
  authenticationRepository,
  userRepository
);
const signupController = new SignupController(signupService);

export const signupRouter = signupController.router;
export { signupService };
