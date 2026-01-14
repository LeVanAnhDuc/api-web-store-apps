import jwt, {
  type Secret,
  type PrivateKey,
  type PublicKey
} from "jsonwebtoken";

import type { TExpiresIn, TPayload } from "@/app/types/databases/jwt";
import { ForbiddenError } from "@/infra/responses/error";
import { TOKEN_EXPIRY, TOKEN_ERRORS } from "@/infra/configs/jwt";
import ENV from "@/infra/configs/env";

const enum TokenType {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
  JWT_ID_SECRET = "JWT_ID_SECRET"
}

interface TokenConfig {
  secret: Secret | PrivateKey;
  expiresIn: TExpiresIn;
}

const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  [TokenType.ACCESS]: {
    secret: ENV.JWT_ACCESS_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  },
  [TokenType.REFRESH]: {
    secret: ENV.JWT_REFRESH_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_REFRESH_TOKEN
  },
  [TokenType.JWT_ID_SECRET]: {
    secret: ENV.JWT_RESET_PASS_SECRET,
    expiresIn: TOKEN_EXPIRY.NUMBER_RESET_PASS_TOKEN
  }
} as const;

const ERROR_TRANSLATION_KEYS: Record<string, I18n.Key> = {
  [TOKEN_ERRORS.JSON_WEB_TOKEN_ERROR]: "common:errors.invalidToken",
  [TOKEN_ERRORS.TOKEN_EXPIRED_ERROR]: "common:errors.tokenExpired"
} as const;

const generateToken = (payload: TPayload, type: TokenType): string => {
  const { secret, expiresIn } = TOKEN_CONFIGS[type];
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = <T = TPayload>(token: string, type: TokenType): T => {
  try {
    const { secret } = TOKEN_CONFIGS[type];
    const payload = jwt.verify(token, secret as Secret | PublicKey);
    return payload as T;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const translationKey = ERROR_TRANSLATION_KEYS[errorName];

    if (translationKey) {
      throw new ForbiddenError(translationKey);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Token verification failed";
    throw new ForbiddenError(errorMessage);
  }
};

export const generateAccessToken = (payload: TPayload): string =>
  generateToken(payload, TokenType.ACCESS);

export const generateRefreshToken = (payload: TPayload): string =>
  generateToken(payload, TokenType.REFRESH);

export const generateResetIdToken = (payload: TPayload): string =>
  generateToken(payload, TokenType.JWT_ID_SECRET);

export const generatePairToken = (payload: TPayload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
  idToken: generateResetIdToken(payload)
});

export const verifyAccessToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TokenType.ACCESS);

export const verifyRefreshToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TokenType.REFRESH);

export const verifyResetIdToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TokenType.JWT_ID_SECRET);

export const JwtService = {
  generateAccessToken,
  generateRefreshToken,
  generateResetIdToken,
  generatePairToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetIdToken
};
