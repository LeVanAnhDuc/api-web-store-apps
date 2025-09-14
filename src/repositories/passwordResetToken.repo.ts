// models
import UserResetPasswordToken from '../models/passwordResetToken.model';
// repositories
import Repository from './base.repo';

class UserResetPasswordTokenRepo extends Repository {
  constructor() {
    super(UserResetPasswordToken, 'UserResetPasswordToken');
  }

  createPasswordResetToken = async ({
    userId,
    email,
    otpCode,
    otpExpireAt,
    resetToken,
    resetTokenExpireAt
  }) => {
    return await this.create({
      userId,
      otpCode,
      otpExpireAt,
      used: false,
      email,
      resetToken,
      resetTokenExpireAt
    });
  };

  updateVerifyOTP = async (token) => {
    return await this.findOneAndUpdate(
      { resetToken: token },
      {
        otpVerified: true,
        otpCode: null,
        otpExpireAt: null
      }
    );
  };

  getVerifiedOTP = async (token) =>
    await this.findOne({ resetToken: token, otpVerified: true });

  usedForPasswordResetToken = async (token) =>
    await this.findOneAndUpdate(
      { resetToken: token },
      { used: true, usedAt: Date.now() }
    );
}

export default UserResetPasswordTokenRepo;
