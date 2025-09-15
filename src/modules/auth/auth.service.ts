// libs
import { bcrypt, jwt, sendEmail, speakeasy } from "@/libs";
import { Response, Request } from "express";
// types
import type { ISuccessResponse } from "@/types/common";
import type { IAuthDocument, ILoginResponse } from "@/types/modules/auth";
// models
// repositories
import AuthRepository from "./auth.repository";
import UserRepository from "../user/user.repository";
// dto
// import { UserResponseDTO } from "@/dto/user";
// others
import CONSTANTS from "@/constants";
import { formatSI, setCookie } from "@/utils";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError
} from "@/responses/error.response";
import { decodeAccessToken } from "@/libs/jwt";
import LOCALES from "./locales";

const { ACCOUNT_NOT_VERIFY, INVALID_EMAIL_OR_PASSWORD, EMAIL_ALREADY_EXISTS } =
  LOCALES.EN.ERROR_MESSAGES;
const { SIGNUP_SUCCESS, LOGIN_SUCCESS } = LOCALES.EN.SUCCESS_MESSAGES;

const {
  SUBJECT_EMAIL_SIGNUP,
  TEMPLATE_EMAIL_SIGNUP,
  SUBJECT_EMAIL_RESET_PASS,
  TEMPLATE_EMAIL_RESET_PASS
} = CONSTANTS.TEMPLATE_EMAIL;
const { NUMBER_ACCESS_TOKEN, NUMBER_REFRESH_TOKEN, NUMBER_RESET_PASS_TOKEN } =
  CONSTANTS.TOKEN;

class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository
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

    const passwordMatch = bcrypt.isValidPassword(password, hashedPassword);
    if (!passwordMatch) {
      throw new BadRequestError(INVALID_EMAIL_OR_PASSWORD);
    }

    if (!verifiedEmail) throw new ForbiddenError(ACCOUNT_NOT_VERIFY);

    await this.authRepository.updateLastLogin(userId.toString());

    const { accessToken, refreshToken } = jwt.generatePairToken(
      userId.toString()
    );

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

    await this.userRepository.createUser({ fullName, authId: _id, phone });

    // const { otp: otpCode, timeExpire } = speakeasy.getOTP();
    // sendEmail({
    //   email,
    //   subject: SUBJECT_EMAIL_SIGNUP,
    //   message: formatSI(TEMPLATE_EMAIL_SIGNUP, { fullName, otpCode })
    // });

    return { message: SIGNUP_SUCCESS };
  };

  public verifySignup = async ({ email, otpCode }) => {
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

    return { message: "Verify successfully" };
  };

  public reSendOTPSignup = async ({ email }) => {
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

    return { message: "Re-send OTP successfully" };
  };

  public logOut = async (res: Response) => {
    // setCookie({ res, name: "accessToken", value: "", maxAge: 0 });
    // setCookie({ res, name: "refreshToken", value: "", maxAge: 0 });
    // setCookie({ res, name: "userInfo", value: "", maxAge: 0 });
    // setCookie({ res, name: "resetPasswordToken", value: "", maxAge: 0 });

    return { message: "Log out successfully" };
  };

  public refreshAccessToken = async (res: Response, req: Request) => {
    //   const refreshToken = req.cookies.refreshToken;
    //   if (!refreshToken) throw new UnauthorizedError('Refresh token is not found');

    //   const payload = jwt.decodeRefreshToken(refreshToken);

    //   if (!payload || !payload.id) throw new UnauthorizedError('Invalid refresh token');

    //   const accessToken = jwt.generateAccessToken({
    //     id: payload.id,
    //   });

    //   setCookie({ res, name: 'accessToken', value: accessToken, maxAge: NUMBER_ACCESS_TOKEN });

    return { message: "Refresh token successfully" };
  };

  public sendOtpForgotPassword = async ({ email }, res) => {
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
    return { message: "Send OTP successfully" };
  };

  public confirmOpForgotPassword = async ({ otpCode }, req) => {
    //   const resetPasswordToken = req.cookies.resetPasswordToken;
    //   if (!resetPasswordToken) throw new UnauthorizedError('Reset password token is not found');

    //   const payload = jwt.decodeResetPasswordToken(resetPasswordToken);
    //   if (!payload || !payload.id) throw new UnauthorizedError('Invalid reset password token');

    //   const verifiedOTP = speakeasy.verifiedOTP(otpCode);
    //   if (!verifiedOTP) throw new BadRequestError('OTP not match');

    //   userResetPasswordTokenRepo.updateVerifyOTP(resetPasswordToken);

    return { message: "Confirm OTP successfully" };
  };

  public updatePasswordForgotPassword = async ({ password }, req) => {
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

    return { message: "Update password successfully" };
  };
}

export default AuthService;
