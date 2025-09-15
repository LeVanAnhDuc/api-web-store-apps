// libs
import express from "express";
// controllers
import AuthController from "./auth.controller";
// repositories
import AuthRepository from "./auth.repository";
// services
import AuthService from "./auth.service";
// schemas
import {
  confirmOpForgotPasswordSchema,
  loginSchema,
  reSendOtpSchema,
  //   sendOtpForgotPassword,
  signupSchema,
  signupVerifySchema,
  updatePasswordForgotPasswordSchema
} from "./dtos/auth.schema";
// middlewares
import { validateSchema } from "@/middlewares/validate.middleware";
// others
import CONSTANTS from "@/constants";
import { asyncHandler } from "@/helper";
import UserRepository from "../user/user.repository";

const {
  LOGIN,
  REFRESH_TOKEN,
  RESEND_OTP,
  SIGNUP,
  VERIFY_SIGNUP,
  LOGOUT,
  CONFIRM_OTP_FORGOT_PASSWORD,
  SEND_OTP_FORGOT_PASSWORD,
  UPDATE_PASSWORD_FORGOT_PASSWORD
} = CONSTANTS.END_POINTS;

const authRouter = express.Router();
const authRepository = new AuthRepository();
const userRepository = new UserRepository();
const authService = new AuthService(authRepository, userRepository);
const authController = new AuthController(authService);

authRouter.post(
  LOGIN,
  validateSchema({ body: loginSchema }),
  asyncHandler(authController.login)
);

authRouter.post(
  SIGNUP,
  validateSchema({ body: signupSchema }),
  asyncHandler(authController.signup)
);

// authRouter.post(
//   VERIFY_SIGNUP,
//   validateSchema({ body: signupVerifySchema }),
//   asyncHandler(authController.verifySignup)
// );
// authRouter.post(
//   RESEND_OTP,
//   validateSchema({ body: reSendOtpSchema }),
//   asyncHandler(authController.reSendOTPSignup)
// );
// authRouter.post(LOGOUT, asyncHandler(authController.logOut));
// authRouter.post(REFRESH_TOKEN, asyncHandler(authController.refreshAccessToken));
// authRouter.post(
//   SEND_OTP_FORGOT_PASSWORD,
//   //   validateSchema({ body: sendOtpForgotPassword }),
//   asyncHandler(authController.sendOtpForgotPassword)
// );
// authRouter.post(
//   CONFIRM_OTP_FORGOT_PASSWORD,
//   validateSchema({ body: confirmOpForgotPasswordSchema }),
//   asyncHandler(authController.confirmOpForgotPassword)
// );
// authRouter.post(
//   UPDATE_PASSWORD_FORGOT_PASSWORD,
//   validateSchema({ body: updatePasswordForgotPasswordSchema }),
//   asyncHandler(authController.updatePasswordForgotPassword)
// );

// Change Password,
// Revoke Token, 2FA

// Revoke Token: ô hiệu hóa một refreshToken hoặc accessToken cụ thể, thường dùng khi phát hiện hành vi đáng ngờ hoặc người dùng đăng xuất
// từ một thiết bị cụ thể.

export { authRepository, authService, authController };
export default authRouter;
