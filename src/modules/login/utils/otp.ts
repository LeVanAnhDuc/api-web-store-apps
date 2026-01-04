import crypto from "crypto";
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";

const RANDOM_BYTES_SIZE = 4;

export const generateLoginOtp = (): string => {
  const min = Math.pow(10, LOGIN_OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, LOGIN_OTP_CONFIG.LENGTH) - 1;

  const randomBytes = crypto.randomBytes(RANDOM_BYTES_SIZE);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % (max - min + 1)) + min;

  return otp.toString();
};
