// types
import type { IAuthDocument } from "@/types/modules/auth";
// models
import AuthModel from "./auth.model";
// repositories
import Repository from "@/repositories/base.repo";

class AuthRepository extends Repository<IAuthDocument> {
  constructor() {
    super(AuthModel, "Auth");
  }

  public findUserByEmail = async (email: string) =>
    await this.findOne({ email });

  public updateLastLogin = async (id: string) =>
    await this.findByIdAndUpdate(id, { lastLogin: new Date() });

  // registerAccountRepo = async ({
  //   fullName,
  //   email,
  //   phone,
  //   password,
  //   otpCode,
  //   otpExpireAt
  // }) => {
  //   return await this.create({
  //     fullName,
  //     email,
  //     phone,
  //     password,
  //     otpCode,
  //     otpExpireAt
  //   });
  // };

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
