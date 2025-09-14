import User from '../models/user.model';
import Repository from './base.repo';

class AuthRepo extends Repository {
  constructor() {
    super(User, 'User');
  }

  findUserRepo = async (emailOrPhone: string) => {
    return await this.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });
  };

  updateLastLoginRepo = async (id: string) => {
    return await this.updateMany(
      { _id: id },
      {
        lastLoginAt: new Date()
      }
    );
  };

  registerAccountRepo = async ({
    fullName,
    email,
    phone,
    password,
    otpCode,
    otpExpireAt
  }) => {
    return await this.create({
      fullName,
      email,
      phone,
      password,
      otpCode,
      otpExpireAt
    });
  };

  verifySignup = async (id) => {
    return await this.updateMany(
      { _id: id },
      {
        verifiedEmail: true,
        otpCode: null,
        otpExpireAt: null
      }
    );
  };

  updateOTP = async ({ email, otpCode, otpExpireAt }) => {
    return await this.updateMany(
      { email },
      {
        otpCode,
        otpExpireAt
      }
    );
  };

  updatePasswordById = async ({ id, password }) =>
    await this.findByIdAndUpdate(id, { password });
}

export default AuthRepo;
