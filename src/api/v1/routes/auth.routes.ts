// libs
import express from "express";
// controllers
import { authController } from "@/modules/auth";
// schemas
import { loginSchema, signupSchema } from "@/modules/auth/auth.schema";
// middlewares
import { validateSchema } from "@/core/middlewares/validate";
// others
import { END_POINTS } from "@/modules/auth/constants";

const {
  LOGIN,
  REFRESH_ACCESS_TOKEN,
  // RESEND_OTP,
  SIGNUP,
  // VERIFY_SIGNUP,
  LOGOUT
  // CONFIRM_OTP_FORGOT_PASSWORD,
  // SEND_OTP_FORGOT_PASSWORD,
  // UPDATE_PASSWORD_FORGOT_PASSWORD
} = END_POINTS;

const authRouter = express.Router();

authRouter.post(
  LOGIN,
  validateSchema({ body: loginSchema }),
  authController.login
);

authRouter.post(
  SIGNUP,
  validateSchema({ body: signupSchema }),
  authController.signup
);

// authRouter.post(
//   VERIFY_SIGNUP,
//   validateSchema({ body: signupVerifySchema }),
//   authController.verifySignup
// );

// authRouter.post(
//   RESEND_OTP,
//   validateSchema({ body: reSendOtpSchema }),
//   authController.reSendOTPSignup
// );

authRouter.post(LOGOUT, authController.logout);

authRouter.post(REFRESH_ACCESS_TOKEN, authController.refreshAccessToken);

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

export default authRouter;
