export enum EmailType {
  LOGIN_OTP = "LOGIN_OTP",
  SIGNUP_OTP = "SIGNUP_OTP",
  MAGIC_LINK = "MAGIC_LINK",
  UNLOCK_TEMP_PASSWORD = "UNLOCK_TEMP_PASSWORD",
  FORGOT_PASSWORD_OTP = "FORGOT_PASSWORD_OTP"
}

export interface LoginOtpData {
  otp: string;
  expiryMinutes: number;
}

export interface SignupOtpData {
  otp: string;
  expiryMinutes: number;
}

export interface MagicLinkData {
  magicLinkUrl: string;
  expiryMinutes: number;
}

export interface ForgotPasswordOtpData {
  otp: string;
  expiryMinutes: number;
}

export interface UnlockTempPasswordData {
  tempPassword: string;
  loginUrl: string;
}

export interface EmailDataMap {
  [EmailType.LOGIN_OTP]: LoginOtpData;
  [EmailType.SIGNUP_OTP]: SignupOtpData;
  [EmailType.MAGIC_LINK]: MagicLinkData;
  [EmailType.UNLOCK_TEMP_PASSWORD]: UnlockTempPasswordData;
  [EmailType.FORGOT_PASSWORD_OTP]: ForgotPasswordOtpData;
}

export interface SendEmailOptions<T extends EmailType> {
  email: string;
  data: EmailDataMap[T];
  locale?: I18n.Locale;
}
