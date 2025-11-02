// types
import { ERole, type IAuthDocument } from "@/modules/auth/auth.types";
// models
import AuthModel from "@/database/models/auth.model";
// repositories
import Repository from "@/core/repositories/base.repo";
// others
import CONSTANTS from "@/core/constants";

const { AUTHENTICATION } = CONSTANTS.MODEL_NAME;

class AuthRepository extends Repository<IAuthDocument> {
  constructor() {
    super(AuthModel, AUTHENTICATION);
  }

  public findUserByEmail = async (email: string) =>
    await this.findOne({ email });

  public updateLastLogin = async (id: string) =>
    await this.findByIdAndUpdate(id, { lastLogin: new Date() });

  public createAccount = async ({ email, password }) =>
    await this.create({
      email,
      password,
      lastLogin: new Date(),
      roles: ERole.USER,
      verifiedEmail: false
    });

  public setSessionUser = async ({
    id,
    refreshToken
  }: {
    id: string;
    refreshToken: string;
  }) => await this.findByIdAndUpdate(id, { refreshToken });

  public removeSessionUser = async (id: string) =>
    await this.findByIdAndUpdate(id, { refreshToken: null });

  // verifySignup = async (id) => {
  //   return await this.updateMany(
  //     { _id: id },
  //     {
  //       verifiedEmail: true,
  //       otpCode: null,
  //       otpExpireAt: null
  //     }
  //   );
  // };

  // updateOTP = async ({ email, otpCode, otpExpireAt }) => {
  //   return await this.updateMany(
  //     { email },
  //     {
  //       otpCode,
  //       otpExpireAt
  //     }
  //   );
  // };

  // updatePasswordById = async ({ id, password }) =>
  //   await this.findByIdAndUpdate(id, { password });
}

export default AuthRepository;
