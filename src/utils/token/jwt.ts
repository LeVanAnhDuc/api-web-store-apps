import jwt, { type Secret } from "jsonwebtoken";
import type { TPayload, TExpiresIn, AuthTokens } from "@/types/jwt";
import { ForbiddenError } from "@/configurations/responses/error";
import { TOKEN_EXPIRY, TOKEN_ERRORS } from "@/constants/infrastructure";
import ENV from "@/configurations/env";

const TOKEN_TYPES = {
  ACCESS: "ACCESS",
  REFRESH: "REFRESH",
  ID_TOKEN: "ID_TOKEN"
} as const;

type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

interface TokenConfig {
  secret: Secret;
  expiresIn: TExpiresIn;
}

const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  [TOKEN_TYPES.ACCESS]: {
    secret: ENV.JWT_ACCESS_SECRET,
    expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN
  },
  [TOKEN_TYPES.REFRESH]: {
    secret: ENV.JWT_REFRESH_SECRET,
    expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN
  },
  [TOKEN_TYPES.ID_TOKEN]: {
    secret: ENV.JWT_ID_SECRET,
    expiresIn: TOKEN_EXPIRY.ID_TOKEN
  }
};

const ERROR_TRANSLATION_KEYS: Record<string, I18n.Key> = {
  [TOKEN_ERRORS.JSON_WEB_TOKEN_ERROR]: "common:errors.invalidToken",
  [TOKEN_ERRORS.TOKEN_EXPIRED_ERROR]: "common:errors.tokenExpired"
};

const generateToken = (payload: TPayload, type: TokenType): string => {
  const { secret, expiresIn } = TOKEN_CONFIGS[type];
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = <T = TPayload>(token: string, type: TokenType): T => {
  try {
    const { secret } = TOKEN_CONFIGS[type];
    return jwt.verify(token, secret) as T;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const translationKey =
      ERROR_TRANSLATION_KEYS[errorName] ?? "common:errors.invalidToken";
    throw new ForbiddenError(translationKey);
  }
};

export const generateAccessToken = (payload: TPayload): string =>
  generateToken(payload, TOKEN_TYPES.ACCESS);

export const generateRefreshToken = (payload: TPayload): string =>
  generateToken(payload, TOKEN_TYPES.REFRESH);

export const generateIdToken = (payload: TPayload): string =>
  generateToken(payload, TOKEN_TYPES.ID_TOKEN);

export const generateAuthTokens = (payload: TPayload): AuthTokens => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
  idToken: generateIdToken(payload)
});

export const verifyAccessToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TOKEN_TYPES.ACCESS);

export const verifyRefreshToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TOKEN_TYPES.REFRESH);

export const verifyIdToken = <T = TPayload>(token: string): T =>
  verifyToken<T>(token, TOKEN_TYPES.ID_TOKEN);
