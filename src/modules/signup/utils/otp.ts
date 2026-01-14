import crypto from "crypto";
import { OTP_CONFIG } from "@/modules/signup/constants";

const RANDOM_BYTES_SIZE = 4;
const SESSION_ID_BYTES_SIZE = 32;

export const generateOtp = (): string => {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;

  const randomBytes = crypto.randomBytes(RANDOM_BYTES_SIZE);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % (max - min + 1)) + min;

  return otp.toString();
};

export const generateSessionId = (): string =>
  crypto.randomBytes(SESSION_ID_BYTES_SIZE).toString("hex");
