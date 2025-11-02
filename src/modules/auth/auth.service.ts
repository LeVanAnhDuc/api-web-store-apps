// libs
import * as bcrypt from "@/core/utils/bcrypt";
import * as jwt from "@/core/utils/jwt";
import type { Request } from "express";
// types
import type { ISuccessResponse } from "@/core/types/common";
import type { ILoginResponse } from "@/modules/auth/auth.types";
// models
// repositories
import type AuthRepository from "./auth.repository";
// TODO: Uncomment when user module is implemented
// import type UserRepository from "../user/user.repository";
// dto
// import { UserResponseDTO } from "@/dto/user";
// others
// import CONSTANTS from "@/constants";
// import { formatSI, setCookie } from "@/utils";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError
} from "@/core/responses/error.response";
// import { decodeAccessToken } from "@/libs/jwt";
import LOCALES from "./locales";

const {
  ACCOUNT_NOT_VERIFY,
  INVALID_EMAIL_OR_PASSWORD,
  EMAIL_ALREADY_EXISTS,
  REFRESH_TOKEN_NOT_FOUND
} = LOCALES.EN.ERROR_MESSAGES;
const { SIGNUP_SUCCESS, LOGIN_SUCCESS, REFRESH_TOKEN_SUCCESS, LOGOUT_SUCCESS } =
  LOCALES.EN.SUCCESS_MESSAGES;

// const {
//   SUBJECT_EMAIL_SIGNUP,
//   TEMPLATE_EMAIL_SIGNUP,
//   SUBJECT_EMAIL_RESET_PASS,
//   TEMPLATE_EMAIL_RESET_PASS
// } = CONSTANTS.TEMPLATE_EMAIL;
// const { NUMBER_ACCESS_TOKEN, NUMBER_REFRESH_TOKEN, NUMBER_RESET_PASS_TOKEN } =
//   CONSTANTS.TOKEN;

class AuthService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly authRepository: AuthRepository
    // TODO: Uncomment when user module is implemented

    // private readonly userRepository: UserRepository
  ) {}

  public login = async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }): Promise<Partial<ISuccessResponse<ILoginResponse>>> => {
    const foundUser = await this.authRepository.findUserByEmail(email);

    if (!foundUser) throw new BadRequestError(INVALID_EMAIL_OR_PASSWORD);

    const { _id: userId, password: hashedPassword, verifiedEmail } = foundUser;
    if (!verifiedEmail) throw new ForbiddenError(ACCOUNT_NOT_VERIFY);

    const passwordMatch = bcrypt.isValidPassword(password, hashedPassword);
    if (!passwordMatch) throw new BadRequestError(INVALID_EMAIL_OR_PASSWORD);

    const { accessToken, refreshToken } = jwt.generatePairToken({
      userId: userId.toString()
    });

    await this.authRepository.setSessionUser({
      id: userId.toString(),
      refreshToken
    });

    return {
      message: LOGIN_SUCCESS,
      data: {
        accessToken,
        refreshToken
      }
    };
  };

  public signup = async ({
    fullName,
    email,
    phone,
    password
  }: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<Partial<ISuccessResponse<string>>> => {
    const emailExists = await this.authRepository.findUserByEmail(email);

    if (emailExists) throw new BadRequestError(EMAIL_ALREADY_EXISTS);

    const hashPassWord = bcrypt.hashPassword(password);
    const { _id } = await this.authRepository.createAccount({
      email,
      password: hashPassWord
    });

    // TODO: Uncomment when user module is implemented
    // await this.userRepository.createUser({
    //   fullName,
    //   authId: _id,
    //   phone
    // });

    // Prevent unused variable warning
    void fullName;
    void _id;
    void phone;

    // const { otp: otpCode, timeExpire } = speakeasy.getOTP();
    // sendEmail({
    //   email,
    //   subject: SUBJECT_EMAIL_SIGNUP,
    //   message: formatSI(TEMPLATE_EMAIL_SIGNUP, { fullName, otpCode })
    // });

    return { message: SIGNUP_SUCCESS };
  };

  public verifySignup = async ({ email: _email, otpCode: _otpCode }) =>
    // const infoUser: IUserDocument =
    //   await this.authRepository.findUserRepo(email);
    // if (!infoUser) throw new BadRequestError("Email not found");

    // const { _id: id, otpExpireAt, verifiedEmail } = infoUser;

    // if (verifiedEmail) throw new BadRequestError("Account already verified");
    // if (new Date().getTime() > otpExpireAt.getTime())
    //   throw new BadRequestError("OTP expired. Please resend OTP");

    // const verifiedOTP = speakeasy.verifiedOTP(otpCode);

    // if (!verifiedOTP) throw new BadRequestError("OTP not match");

    // await this.authRepository.verifySignup(id);

    ({ message: "Verify successfully" });

  public reSendOTPSignup = async ({ email: _email }) =>
    // const infoUser: IUserDocument =
    //   await this.authRepository.findUserRepo(email);

    // if (!infoUser) throw new BadRequestError("Email not found");

    // const { fullName, verifiedEmail } = infoUser;

    // if (verifiedEmail) throw new BadRequestError("Account already verified");

    // const { otp: otpCode, timeExpire } = speakeasy.getOTP();

    // await this.authRepository.updateOTP({
    //   email,
    //   otpCode,
    //   otpExpireAt: new Date(Date.now() + timeExpire * 1000)
    // });

    // await sendEmail({
    //   email,
    //   subject: SUBJECT_EMAIL_SIGNUP,
    //   message: formatSI(TEMPLATE_EMAIL_SIGNUP, { fullName, otpCode })
    // });

    ({ message: "Re-send OTP successfully" });

  public logout = async ({
    userId
  }: {
    userId: string;
  }): Promise<Partial<ISuccessResponse<string>>> => {
    await this.authRepository.removeSessionUser(userId);

    return { message: LOGOUT_SUCCESS };
  };

  public refreshAccessToken = async (
    req: Request
  ): Promise<Partial<ISuccessResponse<{ accessToken: string }>>> => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new UnauthorizedError(REFRESH_TOKEN_NOT_FOUND);

    const payload = jwt.decodeRefreshToken<{ userId: string }>(refreshToken);

    const accessToken = jwt.generateAccessToken({ userId: payload.userId });

    return { message: REFRESH_TOKEN_SUCCESS, data: { accessToken } };
  };

  public sendOtpForgotPassword = async ({ email: _email }, _res) =>
    // const infoUser: IUserDocument = await this.authRepository.findUserRepo(email);
    // if (!infoUser) throw new BadRequestError("Email not found");
    // const { _id: id, fullName } = infoUser;
    // const { otp: otpCode, timeExpire } = speakeasy.getOTP();
    // const resetPasswordToken = jwt.generateResetPasswordToken({ id });
    // await userResetPasswordTokenRepo.createPasswordResetToken({
    //   userId: id,
    //   email,
    //   otpCode,
    //   otpExpireAt: new Date(Date.now() + timeExpire * 1000),
    //   resetToken: resetPasswordToken,
    //   resetTokenExpireAt: new Date(Date.now() + NUMBER_RESET_PASS_TOKEN)
    // });
    // await sendEmail({
    //   email,
    //   subject: SUBJECT_EMAIL_RESET_PASS,
    //   message: formatSI(TEMPLATE_EMAIL_RESET_PASS, { fullName, otpCode })
    // });
    // setCookie({
    //   res,
    //   name: "resetPasswordToken",
    //   value: resetPasswordToken,
    //   maxAge: NUMBER_RESET_PASS_TOKEN + 1000
    // });
    ({ message: "Send OTP successfully" });

  public confirmOpForgotPassword = async ({ otpCode: _otpCode }, _req) =>
    //   const resetPasswordToken = req.cookies.resetPasswordToken;
    //   if (!resetPasswordToken) throw new UnauthorizedError('Reset password token is not found');

    //   const payload = jwt.decodeResetPasswordToken(resetPasswordToken);
    //   if (!payload || !payload.id) throw new UnauthorizedError('Invalid reset password token');

    //   const verifiedOTP = speakeasy.verifiedOTP(otpCode);
    //   if (!verifiedOTP) throw new BadRequestError('OTP not match');

    //   userResetPasswordTokenRepo.updateVerifyOTP(resetPasswordToken);

    ({ message: "Confirm OTP successfully" });

  public updatePasswordForgotPassword = async ({ password: _password }, _req) =>
    //   const resetPasswordToken = req.cookies.resetPasswordToken;
    //   if (!resetPasswordToken) throw new UnauthorizedError('Reset password token is not found');

    //   const payload = jwt.decodeResetPasswordToken(resetPasswordToken);
    //   if (!payload || !payload.id) throw new UnauthorizedError('Invalid reset password token');

    //   const verifiedOTP = userResetPasswordTokenRepo.getVerifiedOTP(resetPasswordToken);
    //   if (!verifiedOTP) throw new BadRequestError('OTP is not verified');

    //   const hashPassWord = bcrypt.hashPassword(password);
    //   this.authRepository.updatePasswordById({ id: payload.id, password: hashPassWord });
    //   userResetPasswordTokenRepo.usedForPasswordResetToken(resetPasswordToken);

    //   setCookie({ res: req.res, name: 'resetPasswordToken', value: '', maxAge: 0 });

    ({ message: "Update password successfully" });
}

export default AuthService;
