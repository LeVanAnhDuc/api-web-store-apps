// // libs
// import * as bcrypt from "@/core/utils/bcrypt";
// import * as jwt from "@/core/utils/jwt";
// import type { Request } from "express";
// // types
// import type { ILoginResponse } from "@/modules/auth/auth.types";
// // repositories
// import type AuthRepository from "./auth.repository";
// // TODO: Uncomment when user module is implemented
// // import type UserRepository from "../user/user.repository";
// // responses
// import {
//   BadRequestError,
//   ForbiddenError,
//   UnauthorizedError
// } from "@/core/responses/error.response";
// // others
// import LOCALES from "./locales";

// const {
//   ACCOUNT_NOT_VERIFY,
//   INVALID_EMAIL_OR_PASSWORD,
//   EMAIL_ALREADY_EXISTS,
//   REFRESH_TOKEN_NOT_FOUND
// } = LOCALES.EN.ERROR_MESSAGES;

// const { SIGNUP_SUCCESS, LOGIN_SUCCESS, REFRESH_TOKEN_SUCCESS, LOGOUT_SUCCESS } =
//   LOCALES.EN.SUCCESS_MESSAGES;

// class AuthService {
//   private readonly authRepository: AuthRepository;
//   // TODO: Uncomment when user module is implemented
//   // private readonly userRepository: UserRepository;

//   constructor(authRepository: AuthRepository) {
//     this.authRepository = authRepository;
//   }

//   /**
//    * User login with email and password
//    */
//   async login(credentials: {
//     email: string;
//     password: string;
//   }): Promise<Partial<ResponsePattern<ILoginResponse>>> {
//     const { email, password } = credentials;

//     const foundUser = await this.authRepository.findUserByEmail(email);
//     if (!foundUser) {
//       throw new BadRequestError(INVALID_EMAIL_OR_PASSWORD);
//     }

//     const { _id: userId, password: hashedPassword, verifiedEmail } = foundUser;

//     if (!verifiedEmail) {
//       throw new ForbiddenError(ACCOUNT_NOT_VERIFY);
//     }

//     const passwordMatch = bcrypt.isValidPassword(password, hashedPassword);
//     if (!passwordMatch) {
//       throw new BadRequestError(INVALID_EMAIL_OR_PASSWORD);
//     }

//     const tokens = this.generateTokenPair(userId.toString());

//     await this.authRepository.setSessionUser({
//       id: userId.toString(),
//       refreshToken: tokens.refreshToken
//     });

//     return {
//       message: LOGIN_SUCCESS,
//       data: tokens
//     };
//   }

//   /**
//    * User signup with email, password and profile info
//    */
//   async signup(data: {
//     fullName: string;
//     email: string;
//     phone: string;
//     password: string;
//   }): Promise<Partial<ResponsePattern<string>>> {
//     const { fullName, email, phone, password } = data;

//     const emailExists = await this.authRepository.findUserByEmail(email);
//     if (emailExists) {
//       throw new BadRequestError(EMAIL_ALREADY_EXISTS);
//     }

//     const hashPassWord = bcrypt.hashPassword(password);
//     const { _id } = await this.authRepository.createAccount({
//       email,
//       password: hashPassWord
//     });

//     // TODO: Uncomment when user module is implemented
//     // await this.userRepository.createUser({
//     //   fullName,
//     //   authId: _id,
//     //   phone
//     // });

//     // TODO: Uncomment when email service is implemented
//     // const { otp: otpCode, timeExpire } = speakeasy.getOTP();
//     // await sendEmail({
//     //   email,
//     //   subject: SUBJECT_EMAIL_SIGNUP,
//     //   message: formatSI(TEMPLATE_EMAIL_SIGNUP, { fullName, otpCode })
//     // });

//     // Prevent unused variable warnings
//     void fullName;
//     void _id;
//     void phone;

//     return { message: SIGNUP_SUCCESS };
//   }

//   /**
//    * Verify signup with OTP code
//    */
//   async verifySignup(data: {
//     email: string;
//     otpCode: string;
//   }): Promise<{ message: string }> {
//     // TODO: Implement OTP verification
//     void data;
//     return { message: "Verify successfully" };

//     // const { email, otpCode } = data;
//     // const infoUser = await this.authRepository.findUserByEmail(email);
//     // if (!infoUser) throw new BadRequestError("Email not found");

//     // const { _id: id, otpExpireAt, verifiedEmail } = infoUser;

//     // if (verifiedEmail) throw new BadRequestError("Account already verified");
//     // if (new Date().getTime() > otpExpireAt.getTime()) {
//     //   throw new BadRequestError("OTP expired. Please resend OTP");
//     // }

//     // const verifiedOTP = speakeasy.verifiedOTP(otpCode);
//     // if (!verifiedOTP) throw new BadRequestError("OTP not match");

//     // await this.authRepository.verifySignup(id);
//   }

//   /**
//    * Resend OTP for signup verification
//    */
//   async reSendOTPSignup(data: { email: string }): Promise<{ message: string }> {
//     // TODO: Implement resend OTP
//     void data;
//     return { message: "Re-send OTP successfully" };

//     // const { email } = data;
//     // const infoUser = await this.authRepository.findUserByEmail(email);
//     // if (!infoUser) throw new BadRequestError("Email not found");

//     // const { fullName, verifiedEmail } = infoUser;
//     // if (verifiedEmail) throw new BadRequestError("Account already verified");

//     // const { otp: otpCode, timeExpire } = speakeasy.getOTP();

//     // await this.authRepository.updateOTP({
//     //   email,
//     //   otpCode,
//     //   otpExpireAt: new Date(Date.now() + timeExpire * 1000)
//     // });

//     // await sendEmail({
//     //   email,
//     //   subject: SUBJECT_EMAIL_SIGNUP,
//     //   message: formatSI(TEMPLATE_EMAIL_SIGNUP, { fullName, otpCode })
//     // });
//   }

//   /**
//    * User logout
//    */
//   async logout(data: {
//     userId: string;
//   }): Promise<Partial<ResponsePattern<string>>> {
//     const { userId } = data;
//     await this.authRepository.removeSessionUser(userId);

//     return { message: LOGOUT_SUCCESS };
//   }

//   /**
//    * Refresh access token using refresh token
//    */
//   async refreshAccessToken(
//     req: Request
//   ): Promise<Partial<ResponsePattern<{ accessToken: string }>>> {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       throw new UnauthorizedError(REFRESH_TOKEN_NOT_FOUND);
//     }

//     const payload = jwt.decodeRefreshToken<{ userId: string }>(refreshToken);
//     const accessToken = jwt.generateAccessToken({ userId: payload.userId });

//     return {
//       message: REFRESH_TOKEN_SUCCESS,
//       data: { accessToken }
//     };
//   }

//   /**
//    * Send OTP for forgot password
//    */
//   async sendOtpForgotPassword(
//     data: { email: string },
//     res: unknown
//   ): Promise<{ message: string }> {
//     // TODO: Implement forgot password OTP
//     void data;
//     void res;
//     return { message: "Send OTP successfully" };

//     // const { email } = data;
//     // const infoUser = await this.authRepository.findUserByEmail(email);
//     // if (!infoUser) throw new BadRequestError("Email not found");

//     // const { _id: id, fullName } = infoUser;
//     // const { otp: otpCode, timeExpire } = speakeasy.getOTP();
//     // const resetPasswordToken = jwt.generateResetPasswordToken({ id });

//     // await userResetPasswordTokenRepo.createPasswordResetToken({
//     //   userId: id,
//     //   email,
//     //   otpCode,
//     //   otpExpireAt: new Date(Date.now() + timeExpire * 1000),
//     //   resetToken: resetPasswordToken,
//     //   resetTokenExpireAt: new Date(Date.now() + NUMBER_RESET_PASS_TOKEN)
//     // });

//     // await sendEmail({
//     //   email,
//     //   subject: SUBJECT_EMAIL_RESET_PASS,
//     //   message: formatSI(TEMPLATE_EMAIL_RESET_PASS, { fullName, otpCode })
//     // });

//     // setCookie({
//     //   res,
//     //   name: "resetPasswordToken",
//     //   value: resetPasswordToken,
//     //   maxAge: NUMBER_RESET_PASS_TOKEN + 1000
//     // });
//   }

//   /**
//    * Confirm OTP for forgot password
//    */
//   async confirmOpForgotPassword(
//     data: { otpCode: string },
//     req: Request
//   ): Promise<{ message: string }> {
//     // TODO: Implement OTP confirmation
//     void data;
//     void req;
//     return { message: "Confirm OTP successfully" };

//     // const { otpCode } = data;
//     // const resetPasswordToken = req.cookies.resetPasswordToken;

//     // if (!resetPasswordToken) {
//     //   throw new UnauthorizedError('Reset password token is not found');
//     // }

//     // const payload = jwt.decodeResetPasswordToken(resetPasswordToken);
//     // if (!payload || !payload.id) {
//     //   throw new UnauthorizedError('Invalid reset password token');
//     // }

//     // const verifiedOTP = speakeasy.verifiedOTP(otpCode);
//     // if (!verifiedOTP) throw new BadRequestError('OTP not match');

//     // userResetPasswordTokenRepo.updateVerifyOTP(resetPasswordToken);
//   }

//   /**
//    * Update password after forgot password flow
//    */
//   async updatePasswordForgotPassword(
//     data: { password: string },
//     req: Request
//   ): Promise<{ message: string }> {
//     // TODO: Implement password update
//     void data;
//     void req;
//     return { message: "Update password successfully" };

//     // const { password } = data;
//     // const resetPasswordToken = req.cookies.resetPasswordToken;

//     // if (!resetPasswordToken) {
//     //   throw new UnauthorizedError('Reset password token is not found');
//     // }

//     // const payload = jwt.decodeResetPasswordToken(resetPasswordToken);
//     // if (!payload || !payload.id) {
//     //   throw new UnauthorizedError('Invalid reset password token');
//     // }

//     // const verifiedOTP = userResetPasswordTokenRepo.getVerifiedOTP(resetPasswordToken);
//     // if (!verifiedOTP) throw new BadRequestError('OTP is not verified');

//     // const hashPassWord = bcrypt.hashPassword(password);
//     // await this.authRepository.updatePasswordById({
//     //   id: payload.id,
//     //   password: hashPassWord
//     // });
//     // userResetPasswordTokenRepo.usedForPasswordResetToken(resetPasswordToken);

//     // setCookie({ res: req.res, name: 'resetPasswordToken', value: '', maxAge: 0 });
//   }

//   /**
//    * Private helper: Generate access and refresh tokens
//    */
//   private generateTokenPair(userId: string): ILoginResponse {
//     const { accessToken, refreshToken } = jwt.generatePairToken({ userId });

//     return {
//       accessToken,
//       refreshToken
//     };
//   }
// }

// export default AuthService;
