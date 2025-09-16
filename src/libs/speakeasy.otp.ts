// libs
import speakeasy from "speakeasy";
// others
import CONSTANTS from "../constants";

const { OTP, ENV } = CONSTANTS;
const { TIME_EXPIRE_OTP, OTP_LENGTH, ENCODING, SECRET_LENGTH } = OTP;

const secret = speakeasy.generateSecret({
  length: SECRET_LENGTH,
  name: ENV.DB_NAME
});
const SECRET_TOKEN = secret.base32;

export const getOTP = () => {
  const otp = speakeasy.totp({
    secret: SECRET_TOKEN,
    encoding: ENCODING,
    step: TIME_EXPIRE_OTP,
    digits: OTP_LENGTH
  });

  return {
    otp,
    timeExpire: TIME_EXPIRE_OTP
  };
};

export const verifiedOTP = (token: string) =>
  speakeasy.totp.verify({
    secret: SECRET_TOKEN,
    encoding: ENCODING,
    step: TIME_EXPIRE_OTP,
    digits: OTP_LENGTH,
    token
  });
