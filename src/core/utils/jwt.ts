// libs
import jwt, {
  type PublicKey,
  type PrivateKey,
  type Secret
} from "jsonwebtoken";
// types
import type { TExpiresIn, TPayload } from "@/types/jwt";
// responses
import { ForbiddenError } from "@/core/responses/error.response";
// others
import CONSTANTS from "@/core/constants";

const { NUMBER_ACCESS_TOKEN, NUMBER_REFRESH_TOKEN, NUMBER_RESET_PASS_TOKEN } =
  CONSTANTS.TOKEN.TIME;
const { JSON_WEB_TOKEN_ERROR, TOKEN_EXPIRED_ERROR } = CONSTANTS.TOKEN.ERROR;
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_RESET_PASS_SECRET } =
  CONSTANTS.ENV;

const ERROR_MESSAGES_MAPPING = {
  [JSON_WEB_TOKEN_ERROR]: "Invalid token",
  [TOKEN_EXPIRED_ERROR]: "Token expired"
};

const generateToken = (
  payload: TPayload,
  secret: Secret | PrivateKey,
  expiresIn: TExpiresIn
) => {
  const token = jwt.sign(payload, secret, { expiresIn });

  return token;
};

const verifyToken = <T>(token: string, secret: Secret | PublicKey): T => {
  try {
    const payload = jwt.verify(token, secret);
    return payload as T;
  } catch (err) {
    if (ERROR_MESSAGES_MAPPING[err.name])
      throw new ForbiddenError(ERROR_MESSAGES_MAPPING[err.name]);

    throw new ForbiddenError(err.message);
  }
};

export const generateAccessToken = (payload: TPayload) =>
  generateToken(payload, JWT_ACCESS_SECRET, NUMBER_ACCESS_TOKEN);
const generateRefreshToken = (payload: TPayload) =>
  generateToken(payload, JWT_REFRESH_SECRET, NUMBER_REFRESH_TOKEN);
export const generateResetPasswordToken = (payload: TPayload) =>
  generateToken(payload, JWT_RESET_PASS_SECRET, NUMBER_RESET_PASS_TOKEN);

export const generatePairToken = (payload: TPayload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload)
});

export const decodeRefreshToken = <T>(token: string) =>
  verifyToken<T>(token, JWT_REFRESH_SECRET);

export const decodeAccessToken = <T>(token: string) =>
  verifyToken<T>(token, JWT_ACCESS_SECRET);

export const decodeResetPasswordToken = <T>(token: string) =>
  verifyToken<T>(token, JWT_RESET_PASS_SECRET);
