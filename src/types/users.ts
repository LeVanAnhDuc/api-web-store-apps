export type TGender = 'FEMALE' | 'MALE' | 'OTHER';
export type TRole = 'ADMIN' | 'USER' | 'MODERATOR';

export interface IUser {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  dateOfBirth: Date;
  gender: TGender;
  avatar: string;
  address: string;
  role: TRole;
  createdAt: Date;
  updatedAt: Date;
  verifiedEmail: boolean;
  otpCode: string;
  otpExpireAt: Date;
  lastLoginAt: Date;
}

export interface IUserSpecifically
  extends Pick<
    IUser,
    'userName' | 'fullName' | 'email' | 'isActive' | 'phone' | 'avatar'
  > {}
